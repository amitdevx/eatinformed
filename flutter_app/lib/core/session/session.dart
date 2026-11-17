import '../network/json_fields.dart';

class AccountSession {
  const AccountSession({
    required this.uid,
    required this.token,
    required this.refreshToken,
    required this.expiresAt,
    required this.email,
    required this.name,
    required this.isGuest,
    this.photoUrl,
    this.handle,
  });

  factory AccountSession.fromJson(Map<String, dynamic> data) {
    final user = jsonObject(data['user']);
    if (user['isAnonymous'] is! bool || data['expiresAt'] is! num) {
      throw const FormatException('Invalid session metadata.');
    }
    return AccountSession(
      uid: requiredText(user, 'uid'),
      token: requiredText(data, 'token'),
      refreshToken: requiredText(data, 'refreshToken'),
      expiresAt: DateTime.fromMillisecondsSinceEpoch(
        (data['expiresAt'] as num).toInt(),
      ),
      email: optionalText(user, 'email') ?? '',
      name: requiredText(user, 'name'),
      isGuest: user['isAnonymous'] as bool,
      photoUrl: optionalText(user, 'photoUrl'),
      handle: optionalText(user, 'handle'),
    );
  }

  final String uid, token, refreshToken, email, name;
  final DateTime expiresAt;
  final bool isGuest;
  final String? photoUrl, handle;

  Map<String, dynamic> toJson() => {
    'token': token,
    'refreshToken': refreshToken,
    'expiresAt': expiresAt.millisecondsSinceEpoch,
    'user': {
      'uid': uid,
      'email': email,
      'name': name,
      'isAnonymous': isGuest,
      'photoUrl': photoUrl,
      'handle': handle,
    },
  };
}
