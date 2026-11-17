import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:eatinformed_mobile/core/session/session.dart';
import 'package:eatinformed_mobile/core/session/session_store.dart';

import 'support.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  const channel = MethodChannel('plugins.it_nomads.com/flutter_secure_storage');
  final values = <String, String>{};
  setUp(() {
    values.clear();
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (call) async {
          final args = call.arguments as Map<dynamic, dynamic>;
          final key = args['key'] as String;
          switch (call.method) {
            case 'read':
              return values[key];
            case 'write':
              values[key] = args['value'] as String;
              return null;
            case 'delete':
              values.remove(key);
              return null;
            default:
              throw StateError('Unexpected storage operation');
          }
        });
  });
  tearDown(
    () => TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, null),
  );
  test('secure-storage adapter round trips only its own session key', () async {
    final store = SecureSessionStore();
    await store.write(AccountSession.fromJson(sessionJson()));
    values['unrelated-setting'] = 'keep';
    expect((await store.read())?.uid, 'firebase-test-uid');
    await store.clear();
    expect(await store.read(), isNull);
    expect(values['unrelated-setting'], 'keep');
  });
  test(
    'malformed persisted session is removed instead of authenticating',
    () async {
      final store = SecureSessionStore();
      await store.write(AccountSession.fromJson(sessionJson()));
      final key = values.keys.single;
      values[key] = '{"user":null}';
      expect(await store.read(), isNull);
      expect(values, isEmpty);
    },
  );
}
