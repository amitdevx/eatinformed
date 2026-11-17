import 'package:eatinformed_mobile/core/session/session.dart';
import 'package:eatinformed_mobile/core/session/session_store.dart';

Map<String, dynamic> sessionJson({
  String uid = 'firebase-test-uid',
  bool guest = false,
  int expiresAt = 4102444800000,
}) => {
  'token': 'test-token-never-used-against-a-server',
  'refreshToken': 'test-refresh',
  'expiresAt': expiresAt,
  'user': {
    'uid': uid,
    'name': 'Test Reader',
    'email': guest ? '' : 'reader@example.test',
    'isAnonymous': guest,
  },
};

class MemorySessionStore implements SessionStore {
  AccountSession? value;
  @override
  Future<AccountSession?> read() async => value;
  @override
  Future<void> write(AccountSession session) async {
    value = session;
  }

  @override
  Future<void> clear() async {
    value = null;
  }
}
