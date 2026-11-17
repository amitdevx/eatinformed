import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';

import '../../core/network/api_client.dart';
import '../../core/network/api_failure.dart';
import '../../core/session/session.dart';

String randomKey() {
  final random = Random.secure();
  final bytes = List<int>.generate(16, (_) => random.nextInt(256));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  final hex = bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  return '${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}';
}

class AuthRepository {
  AuthRepository(this.api, {Future<String> Function(Uri)? authorize})
    : _authorize = authorize ?? _browser;
  final ApiClient api;
  final Future<String> Function(Uri) _authorize;
  static Future<String> _browser(Uri url) => FlutterWebAuth2.authenticate(
    url: url.toString(),
    callbackUrlScheme: 'eatinformed',
  );
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
  Future<AccountSession> link(
    AccountSession guest,
    String email,
    String password,
  ) async => AccountSession.fromJson(
    await api.request(
      'POST',
      '/api/auth/mobile',
      token: guest.token,
      body: {
        'type': 'link',
        'idToken': guest.token,
        'email': email.trim(),
        'password': password,
      },
    ),
  );
  Future<AccountSession> refresh(AccountSession session) =>
      _authenticate({'type': 'refresh', 'refreshToken': session.refreshToken});
  Future<AccountSession> _authenticate(Map<String, dynamic> body) async =>
      AccountSession.fromJson(
        await api.request('POST', '/api/auth/mobile', body: body),
      );
  Future<AccountSession> google() async {
    final state = randomKey(), verifier = randomKey() + randomKey();
    final challenge = sha256.convert(utf8.encode(verifier)).toString();
    final url = api.config.apiOrigin
        .resolve('/mobile-auth')
        .replace(
          queryParameters: {
            'redirect_uri': 'eatinformed://auth/callback',
            'state': state,
            'challenge': challenge,
          },
        );
    final result = Uri.parse(await _authorize(url));
    if (result.scheme != 'eatinformed' ||
        result.host != 'auth' ||
        result.path != '/callback' ||
        result.hasQuery) {
      throw const ApiFailure(
        'invalid_callback',
        'Unexpected sign-in callback.',
      );
    }
    final params = Uri.splitQueryString(result.fragment);
    if (params['state'] != state) {
      throw const ApiFailure(
        'invalid_callback',
        'Sign-in could not be verified.',
      );
    }
    if (params['error'] != null) {
      throw const ApiFailure(
        'sign_in_cancelled',
        'Google sign-in was cancelled.',
      );
    }
    final code = params['code'];
    if (code == null || code.isEmpty) {
      throw const ApiFailure(
        'invalid_callback',
        'Could not complete Google sign-in.',
      );
    }
    return AccountSession.fromJson(
      await api.request(
        'POST',
        '/api/auth/bridge',
        body: {'mode': 'exchange', 'code': code, 'verifier': verifier},
      ),
    );
  }
}
