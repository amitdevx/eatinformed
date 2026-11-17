import '../../core/network/api_client.dart';
import '../../core/session/session.dart';

class AuthRepository {
  AuthRepository(this.api);
  final ApiClient api;
  Future<AccountSession> guest() => _authenticate({'type': 'guest'});
  Future<AccountSession> email(
    String email,
    String password, {
    bool create = false,
  }) => _authenticate({
    'type': create ? 'signUp' : 'signIn',
    'email': email.trim(),
    'password': password,
  });
  Future<AccountSession> refresh(AccountSession session) =>
      _authenticate({'type': 'refresh', 'refreshToken': session.refreshToken});
  Future<AccountSession> _authenticate(Map<String, dynamic> body) async =>
      AccountSession.fromJson(
        await api.request('POST', '/api/auth/mobile', body: body),
      );
}
