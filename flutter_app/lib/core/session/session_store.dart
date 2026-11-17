import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'session.dart';

abstract interface class SessionStore {
  Future<AccountSession?> read();
  Future<void> write(AccountSession session);
  Future<void> clear();
}

class SecureSessionStore implements SessionStore {
  SecureSessionStore([FlutterSecureStorage? storage])
    : _storage = storage ?? const FlutterSecureStorage();
  final FlutterSecureStorage _storage;
  static const _key = 'eatinformed_flutter_session_v1';

  @override
  Future<AccountSession?> read() async {
    final raw = await _storage.read(key: _key);
    if (raw == null) return null;
    try {
      final data = jsonDecode(raw);
      if (data is! Map<String, dynamic>) throw const FormatException();
      return AccountSession.fromJson(data);
    } on FormatException {
      await clear();
      return null;
    }
  }

  @override
  Future<void> write(AccountSession session) =>
      _storage.write(key: _key, value: jsonEncode(session.toJson()));
  @override
  Future<void> clear() => _storage.delete(key: _key);
}
