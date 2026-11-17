import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:eatinformed_mobile/app/config.dart';
import 'package:eatinformed_mobile/core/network/api_client.dart';
import 'package:eatinformed_mobile/core/session/session.dart';
import 'package:eatinformed_mobile/features/auth/auth_controller.dart';
import 'package:eatinformed_mobile/features/auth/auth_repository.dart';

import 'support.dart';

void main() {
  AuthController controller(
    MemorySessionStore store,
    Future<http.Response> Function(http.Request) send,
  ) {
    final api = ApiClient(
      AppConfig(apiOrigin: Uri.parse('https://api.example.test')),
      client: MockClient(send),
    );
    addTearDown(api.close);
    final auth = AuthController(AuthRepository(api), store);
    addTearDown(auth.dispose);
    return auth;
  }

  test(
    'restores valid session without creating a fresh anonymous identity',
    () async {
      final store = MemorySessionStore()
        ..value = AccountSession.fromJson(sessionJson(guest: true));
      final auth = controller(
        store,
        (_) async => throw StateError('No network needed'),
      );
      await auth.restore();
      expect(auth.phase, AuthPhase.signedIn);
      expect(auth.session?.uid, 'firebase-test-uid');
    },
  );
  test('expired session refresh must preserve verified UID', () async {
    final store = MemorySessionStore()
      ..value = AccountSession.fromJson(sessionJson(expiresAt: 1));
    final auth = controller(store, (request) async {
      expect(jsonDecode(request.body), {
        'type': 'refresh',
        'refreshToken': 'test-refresh',
      });
      return http.Response(
        jsonEncode(sessionJson(uid: 'another-account')),
        200,
      );
    });
    await auth.restore();
    expect(auth.phase, AuthPhase.signedOut);
    expect(auth.failure?.code, 'identity_changed');
    expect(store.value, isNull);
  });
  test('authentication outage never becomes successful guest entry', () async {
    final auth = controller(
      MemorySessionStore(),
      (_) async => http.Response(
        jsonEncode({
          'code': 'auth_unavailable',
          'error': 'Authentication unavailable',
        }),
        503,
      ),
    );
    await auth.restore();
    await auth.signIn();
    expect(auth.phase, AuthPhase.signedOut);
    expect(auth.session, isNull);
    expect(auth.failure?.status, 503);
  });
  test('late sign-in response cannot resurrect a signed-out account', () async {
    final response = Completer<http.Response>();
    final store = MemorySessionStore();
    final auth = controller(store, (_) => response.future);
    await auth.restore();
    final pending = auth.signIn();
    await Future<void>.delayed(Duration.zero);
    await auth.signOut();
    response.complete(http.Response(jsonEncode(sessionJson()), 200));
    await pending;
    expect(auth.phase, AuthPhase.signedOut);
    expect(auth.session, isNull);
    expect(store.value, isNull);
  });
  test(
    'logout waits for an in-flight secure write before clearing it',
    () async {
      final writing = Completer<void>(), release = Completer<void>();
      final store = DelayedStore(writing, release);
      final auth = controller(
        store,
        (_) async => http.Response(jsonEncode(sessionJson()), 200),
      );
      await auth.restore();
      final pending = auth.signIn();
      await writing.future;
      final logout = auth.signOut();
      release.complete();
      await Future.wait([pending, logout]);
      expect(auth.session, isNull);
      expect(store.value, isNull);
    },
  );
}

class DelayedStore extends MemorySessionStore {
  DelayedStore(this.writing, this.release);
  final Completer<void> writing, release;
  @override
  Future<void> write(AccountSession session) async {
    writing.complete();
    await release.future;
    await super.write(session);
  }
}
