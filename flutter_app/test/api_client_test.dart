import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:eatinformed_mobile/app/config.dart';
import 'package:eatinformed_mobile/core/network/api_client.dart';
import 'package:eatinformed_mobile/core/network/api_failure.dart';
import 'package:eatinformed_mobile/core/session/session.dart';
import 'package:eatinformed_mobile/features/auth/auth_repository.dart';

import 'support.dart';

void main() {
  final config = AppConfig(apiOrigin: Uri.parse('https://api.example.test'));
  test('configured origin rejects cleartext and credentials', () {
    for (final value in [
      'http://api.example.test',
      'https://user:secret@api.example.test',
      'https://api.example.test/path',
    ]) {
      expect(() => AppConfig(apiOrigin: Uri.parse(value)), throwsArgumentError);
    }
  });
  test(
    'guest adapter sends existing schema without an invented bearer token',
    () async {
      final api = ApiClient(
        config,
        client: MockClient((request) async {
          expect(
            request.url.toString(),
            'https://api.example.test/api/auth/mobile',
          );
          expect(request.method, 'POST');
          expect(request.headers.containsKey('Authorization'), isFalse);
          expect(jsonDecode(request.body), {'type': 'guest'});
          return http.Response(jsonEncode(sessionJson(guest: true)), 200);
        }),
      );
      addTearDown(api.close);
      final session = await AuthRepository(api).guest();
      expect(session.isGuest, isTrue);
      expect(session.uid, 'firebase-test-uid');
    },
  );
  test(
    'errors retain backend status, machine code and request correlation',
    () async {
      final api = ApiClient(
        config,
        client: MockClient(
          (_) async => http.Response(
            jsonEncode({
              'code': 'scan_in_progress',
              'error': 'Processing',
              'requestId': 'correlation-id',
            }),
            409,
          ),
        ),
      );
      addTearDown(api.close);
      await expectLater(
        api.request('POST', '/api/scan'),
        throwsA(
          isA<ApiFailure>()
              .having((e) => e.code, 'code', 'scan_in_progress')
              .having((e) => e.status, 'status', 409)
              .having((e) => e.requestId, 'requestId', 'correlation-id'),
        ),
      );
    },
  );
  test('non-JSON service response fails without exposing HTML', () async {
    final api = ApiClient(
      config,
      client: MockClient(
        (_) async => http.Response('<html>provider internals</html>', 502),
      ),
    );
    addTearDown(api.close);
    await expectLater(
      api.request('GET', '/api/profile'),
      throwsA(
        isA<ApiFailure>().having((e) => e.code, 'code', 'invalid_response'),
      ),
    );
  });
  test('credential-bearing API paths cannot target another origin', () async {
    final api = ApiClient(
      config,
      client: MockClient((_) async => throw StateError('Must not send')),
    );
    addTearDown(api.close);
    await expectLater(
      api.request('GET', 'https://untrusted.example', token: 'secret'),
      throwsArgumentError,
    );
  });
  test(
    'cancellation aborts the request without turning it into success',
    () async {
      final cancelled = Completer<void>();
      final api = ApiClient(config, client: AbortClient());
      addTearDown(api.close);
      final pending = api.request(
        'GET',
        '/api/profile',
        cancellation: cancelled.future,
      );
      cancelled.complete();
      await expectLater(
        pending,
        throwsA(
          isA<ApiFailure>().having((e) => e.code, 'code', 'request_cancelled'),
        ),
      );
    },
  );
  test(
    'request deadline aborts transport and returns an actionable timeout',
    () async {
      final client = AbortClient();
      final api = ApiClient(config, client: client);
      addTearDown(api.close);
      await expectLater(
        api.request('GET', '/api/profile', timeout: Duration.zero),
        throwsA(
          isA<ApiFailure>().having((e) => e.code, 'code', 'request_timeout'),
        ),
      );
      await Future<void>.delayed(Duration.zero);
      expect(client.aborted, isTrue);
    },
  );
  test('missing identity fields and invalid guest claims fail parsing', () {
    final malformed = sessionJson();
    (malformed['user'] as Map<String, dynamic>)['isAnonymous'] = 'true';
    expect(() => AccountSession.fromJson(malformed), throwsFormatException);
  });
}

class AbortClient extends http.BaseClient {
  bool aborted = false;
  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    final pending = request as http.AbortableRequest;
    await pending.abortTrigger;
    aborted = true;
    throw http.RequestAbortedException(request.url);
  }
}
