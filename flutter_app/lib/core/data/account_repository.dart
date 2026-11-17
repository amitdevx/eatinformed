import 'dart:convert';

import '../../features/auth/auth_controller.dart';
import '../network/api_failure.dart';
import '../network/json_fields.dart';
import 'models.dart';
import 'preferences.dart';

class AccountRepository {
  AccountRepository(this.auth, this.store);
  final AuthController auth;
  final PreferenceStore store;
  Future<Map<String, dynamic>> request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    Map<String, String>? query,
    Map<String, String> headers = const {},
    Duration timeout = const Duration(seconds: 15),
    Future<void>? cancellation,
  }) async {
    final identity = await auth.validSession();
    final result = await auth.repository.api.request(
      method,
      path,
      token: identity.token,
      body: body,
      query: query,
      headers: headers,
      timeout: timeout,
      cancellation: cancellation,
    );
    if (auth.session?.uid != identity.uid) {
      throw const ApiFailure(
        'account_changed',
        'Account changed. Please retry.',
      );
    }
    return result;
  }

  String cacheKey(String uid) => 'history:$uid';
  Future<List<ScanRecord>> history({bool offline = true}) async {
    final uid = auth.session?.uid;
    if (uid == null) {
      throw const ApiFailure('auth_required', 'Sign in to view history.');
    }
    final items = <ScanRecord>[];
    final seen = <String>{};
    String? cursor;
    try {
      do {
        final page = await request(
          'GET',
          '/api/history',
          query: cursor == null ? null : {'cursor': cursor},
        );
        items.addAll(
          (page['items'] as List).map(
            (e) => ScanRecord.fromJson(jsonObject(e)),
          ),
        );
        cursor = page['nextCursor'] as String?;
        if (cursor != null && !seen.add(cursor)) {
          throw const FormatException('Repeated history cursor');
        }
      } while (cursor != null);
      if (auth.session?.uid != uid) {
        throw const ApiFailure('account_changed', 'Account changed.');
      }
      await store.write(
        cacheKey(uid),
        jsonEncode(items.take(100).map((e) => e.toJson()).toList()),
      );
      return items;
    } on ApiFailure catch (e) {
      if (!offline || !e.isTransportFailure || auth.session?.uid != uid) {
        rethrow;
      }
      final raw = await store.read(cacheKey(uid));
      if (raw == null) rethrow;
      throw OfflineHistory(
        (jsonDecode(raw) as List)
            .map((e) => ScanRecord.fromJson(jsonObject(e)))
            .toList(),
      );
    }
  }

  Future<Map<String, dynamic>> profile() => request('GET', '/api/profile');
  Future<void> saveProfile({
    required String name,
    required String handle,
    required List<String> allergens,
  }) async {
    if (auth.session?.isGuest == true) {
      throw const ApiFailure(
        'guest_profile_locked',
        'Create an account to customize your profile.',
      );
    }
    final uid = auth.session?.uid;
    await request(
      'PATCH',
      '/api/profile',
      body: {'name': name, 'handle': handle, 'allergens': allergens},
    );
    await auth.updateProfile(
      name: name,
      handle: handle,
      allergens: allergens,
      expectedUid: uid,
    );
  }

  Future<Quota> quota() async => Quota.fromJson(
    jsonObject(
      (await request('GET', '/api/scan', query: {'quota': 'true'}))['quota'],
    ),
  );
  Future<void> clearCache() async {
    final uid = auth.session?.uid;
    if (uid != null) await store.write(cacheKey(uid), null);
  }

  Future<void> delete(String id) async {
    await request('DELETE', '/api/history', query: {'id': id});
    await clearCache();
  }
}

class OfflineHistory implements Exception {
  OfflineHistory(this.items);
  final List<ScanRecord> items;
}
