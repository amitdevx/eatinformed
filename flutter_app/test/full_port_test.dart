import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:eatinformed_mobile/app/config.dart';
import 'package:eatinformed_mobile/core/data/account_repository.dart';
import 'package:eatinformed_mobile/core/data/models.dart';
import 'package:eatinformed_mobile/core/data/preferences.dart';
import 'package:eatinformed_mobile/core/network/api_client.dart';
import 'package:eatinformed_mobile/core/network/api_failure.dart';
import 'package:eatinformed_mobile/features/auth/auth_controller.dart';
import 'package:eatinformed_mobile/features/auth/auth_repository.dart';
import 'package:eatinformed_mobile/features/library/library.dart';
import 'package:eatinformed_mobile/features/results/allergen_matches.dart';
import 'package:eatinformed_mobile/features/scan/scan_service.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:image/image.dart' as img;

import 'support.dart';

Map<String, dynamic> report({String id = 'saved-scan'}) => {
  'status': 'success',
  'scanId': id,
  'productName': 'Label fixture',
  'rating': null,
  'novaGroup': null,
  'ingredients': ['Milk powder'],
  'dietaryInfo': {'isVegan': null},
};
Map<String, dynamic> record(String id) => {
  'id': id,
  'timestamp': 1700000000000,
  'data': report(id: id),
};

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  Future<(AuthController, AccountRepository)> account(
    Future<http.Response> Function(http.Request) handler, {
    MemoryPreferences? prefs,
    bool guest = false,
  }) async {
    final api = ApiClient(
      AppConfig(apiOrigin: Uri.parse('https://api.example.test')),
      client: MockClient(
        (r) => r.url.path == '/api/auth/mobile'
            ? Future.value(
                http.Response(jsonEncode(sessionJson(guest: guest)), 200),
              )
            : handler(r),
      ),
    );
    final auth = AuthController(AuthRepository(api), MemorySessionStore());
    await auth.signIn();
    addTearDown(() {
      auth.dispose();
      api.close();
    });
    return (auth, AccountRepository(auth, prefs ?? MemoryPreferences()));
  }

  test('offline guide preserves four NOVA groups, 22 additives and three marked samples', () async {
    final library = await FoodLibrary.load();
    expect(library.nova.map((e) => e['group']), [1, 2, 3, 4]);
    expect(library.additives.length, 22);
    expect(library.samples.length, 3);
    for (final sample in library.samples) {
      ProductResult(Map<String, dynamic>.from(sample['data'] as Map));
    }
  });
  test(
    'unknown estimates remain unknown and malformed reports are rejected',
    () {
      final value = ProductResult(report());
      expect(value.rating, isNull);
      expect(value.nova, isNull);
      expect(value.dietary['isVegan'], isNull);
      for (final bad in [
        {'rating': 6},
        {'novaGroup': 0},
        {'rating': '2.5'},
        {
          'ingredientAnalysis': [
            {'ingredient': 8},
          ],
        },
        {
          'nutrition': {'nutrients': 'bad'},
        },
        {
          'pros': [2],
        },
        {
          'dietaryInfo': {
            'allergens': [false],
          },
        },
        {'status': 'unreadable'},
      ]) {
        expect(
          () => ProductResult({...report(), ...bad}),
          throwsFormatException,
        );
      }
    },
  );
  test(
    'preferences match whole evidence phrases, not unrelated substrings',
    () {
      final matches = personalAllergenMatches(
        ['milk', 'nut', 'peanut'],
        ['Milk powder', 'may contain peanut', 'coconut oil'],
      );
      expect(matches.keys, ['milk', 'peanut']);
      expect(matches['peanut'], ['may contain peanut']);
    },
  );
  test('full history pagination retains repeated products and scopes the cache by UID', () async {
    final prefs = MemoryPreferences();
    var calls = 0;
    final (_, repo) = await account((r) async {
      calls++;
      expect(r.headers['authorization'], startsWith('Bearer '));
      return http.Response(
        jsonEncode({
          'items': [record(calls == 1 ? 'a' : 'b')],
          'nextCursor': calls == 1 ? 'page-2' : null,
        }),
        200,
      );
    }, prefs: prefs);
    final rows = await repo.history();
    expect(rows.map((e) => e.id), ['a', 'b']);
    expect(rows.map((e) => e.result.name).toSet().length, 1);
    expect(calls, 2);
    expect(prefs.values.keys, ['history:firebase-test-uid']);
  });
  test(
    'account change during history request discards response and cache write',
    () async {
      final gate = Completer<http.Response>(), prefs = MemoryPreferences();
      final (auth, repo) = await account((_) => gate.future, prefs: prefs);
      final future = repo.history();
      await Future<void>.delayed(Duration.zero);
      await auth.signOut();
      gate.complete(
        http.Response(
          jsonEncode({
            'items': [record('a')],
            'nextCursor': null,
          }),
          200,
        ),
      );
      await expectLater(
        future,
        throwsA(
          isA<ApiFailure>().having((e) => e.code, 'code', 'account_changed'),
        ),
      );
      expect(prefs.values, isEmpty);
    },
  );
  test('guest profile editing is rejected before a network mutation', () async {
    var calls = 0;
    final (_, repo) = await account((_) async {
      calls++;
      return http.Response('{}', 200);
    }, guest: true);
    await expectLater(
      repo.saveProfile(name: 'Reader', handle: 'reader', allergens: []),
      throwsA(isA<ApiFailure>()),
    );
    expect(calls, 0);
  });
  test(
    'pending retry uses the identical payload and idempotency key',
    () async {
      final requests = <http.Request>[];
      final (_, repo) = await account((r) async {
        requests.add(r);
        return requests.length == 1
            ? http.Response(
                jsonEncode({'code': 'scan_in_progress', 'error': 'Processing'}),
                409,
              )
            : http.Response(jsonEncode(report()), 200);
      });
      final operation = ScanOperation(Uint8List.fromList([1, 2, 3]));
      final result = await operation.execute(repo);
      expect(result.scanId, 'saved-scan');
      expect(requests.length, 2);
      expect(requests[0].body, requests[1].body);
      expect(requests[0].headers['idempotency-key'], operation.key);
      expect(requests[1].headers['idempotency-key'], operation.key);
    },
  );
  test(
    'cancel waiting stops pending retries without a fresh operation',
    () async {
      final cancel = Completer<void>();
      var calls = 0;
      final (_, repo) = await account((r) async {
        calls++;
        cancel.complete();
        return http.Response(
          jsonEncode({'code': 'scan_in_progress', 'error': 'Processing'}),
          409,
        );
      });
      await expectLater(
        ScanOperation(Uint8List(1)).execute(repo, cancellation: cancel.future),
        throwsA(
          isA<ApiFailure>().having((e) => e.code, 'code', 'request_cancelled'),
        ),
      );
      expect(calls, 1);
    },
  );
  test('provider failure stays an error rather than a successful or unreadable scan', () async {
    var calls = 0;
    final (_, repo) = await account((_) async {
      calls++;
      return http.Response(
        jsonEncode({
          'code': 'provider_timeout',
          'error': 'Analysis unavailable',
          'requestId': 'trace-id',
        }),
        504,
      );
    });
    await expectLater(
      ScanOperation(Uint8List(1)).execute(repo),
      throwsA(
        isA<ApiFailure>()
            .having((e) => e.status, 'status', 504)
            .having((e) => e.requestId, 'trace', 'trace-id'),
      ),
    );
    expect(calls, 1);
  });
  test('image preparation preserves complete edges and aspect ratio without implicit cropping', () {
    final source = img.Image(width: 120, height: 80);
    img.fill(source, color: img.ColorRgb8(245, 245, 245));
    img.fillRect(
      source,
      x1: 0,
      y1: 0,
      x2: 14,
      y2: 79,
      color: img.ColorRgb8(255, 0, 0),
    );
    img.fillRect(
      source,
      x1: 105,
      y1: 0,
      x2: 119,
      y2: 79,
      color: img.ColorRgb8(0, 0, 255),
    );
    final output = img.decodeJpg(prepareLabel(img.encodePng(source)))!;
    expect(output.width, 120);
    expect(output.height, 80);
    expect(output.getPixel(3, 40).r, greaterThan(200));
    expect(output.getPixel(116, 40).b, greaterThan(200));
    expect(
      () => prepareLabel(Uint8List.fromList([1, 2, 3])),
      throwsFormatException,
    );
  });
  test('EXIF orientation is baked into pixels before upload', () {
    final source = img.Image(width: 120, height: 80);
    source.exif.imageIfd.orientation = 6;
    final encoded = img.encodeJpg(source);
    final output = img.decodeJpg(prepareLabel(encoded))!;
    expect(output.width, 80);
    expect(output.height, 120);
    expect(output.exif.imageIfd.orientation, isNot(6));
  });
}
