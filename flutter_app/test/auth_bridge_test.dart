import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:eatinformed_mobile/app/config.dart';
import 'package:eatinformed_mobile/core/network/api_client.dart';
import 'package:eatinformed_mobile/core/network/api_failure.dart';
import 'package:eatinformed_mobile/features/auth/auth_controller.dart';
import 'package:eatinformed_mobile/features/auth/auth_repository.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'support.dart';

void main() {
  test('Google bridge binds callback state and exchanges the one-use code with its verifier', () async {
    Uri? launched;
    Map<String, dynamic>? exchanged;
    final api = ApiClient(
      AppConfig(apiOrigin: Uri.parse('https://api.example.test')),
      client: MockClient((r) async {
        expect(r.url.path, '/api/auth/bridge');
        exchanged = jsonDecode(r.body) as Map<String, dynamic>;
        return http.Response(jsonEncode(sessionJson()), 200);
      }),
    );
    addTearDown(api.close);
    final repo = AuthRepository(
      api,
      authorize: (uri) async {
        launched = uri;
        return 'eatinformed://auth/callback#state=${uri.queryParameters['state']}&code=one-use-code';
      },
    );
    final session = await repo.google();
    expect(session.uid, 'firebase-test-uid');
    expect(exchanged!['mode'], 'exchange');
    expect(exchanged!['code'], 'one-use-code');
    expect(
      sha256.convert(utf8.encode(exchanged!['verifier'] as String)).toString(),
      launched!.queryParameters['challenge'],
    );
    expect(
      launched!.queryParameters['redirect_uri'],
      'eatinformed://auth/callback',
    );
  });
  test(
    'untrusted callback and state mismatch never reach session exchange',
    () async {
      var calls = 0;
      final api = ApiClient(
        AppConfig(apiOrigin: Uri.parse('https://api.example.test')),
        client: MockClient((_) async {
          calls++;
          return http.Response('{}', 200);
        }),
      );
      addTearDown(api.close);
      for (final callback in [
        'eatinformed://auth/callback#state=forged&code=code',
        'https://attacker.test/callback#code=code',
        'eatinformed://auth/callback?code=code',
      ]) {
        await expectLater(
          AuthRepository(api, authorize: (_) async => callback).google(),
          throwsA(isA<ApiFailure>()),
        );
      }
      expect(calls, 0);
    },
  );
  test('email registration links an existing guest through the protected link contract', () async {
    final bodies = <Map<String, dynamic>>[];
    final api = ApiClient(
      AppConfig(apiOrigin: Uri.parse('https://api.example.test')),
      client: MockClient((r) async {
        final body = jsonDecode(r.body) as Map<String, dynamic>;
        bodies.add(body);
        if (body['type'] == 'link') {
          expect(r.headers['authorization'], startsWith('Bearer '));
        }
        return http.Response(
          jsonEncode(sessionJson(guest: body['type'] == 'guest')),
          200,
        );
      }),
    );
    final auth = AuthController(AuthRepository(api), MemorySessionStore());
    addTearDown(() {
      auth.dispose();
      api.close();
    });
    await auth.signIn();
    final uid = auth.session!.uid;
    await auth.signIn(
      email: 'reader@example.test',
      password: 'test-password',
      create: true,
    );
    expect(bodies.last['type'], 'link');
    expect(bodies.last['idToken'], isNotEmpty);
    expect(auth.session!.uid, uid);
    expect(auth.session!.isGuest, false);
  });
}
