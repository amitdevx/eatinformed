import 'package:flutter/foundation.dart';

import '../../core/network/api_failure.dart';
import '../../core/session/session.dart';
import '../../core/session/session_store.dart';
import 'auth_repository.dart';

enum AuthPhase { restoring, signedOut, signedIn }

class AuthController extends ChangeNotifier {
  AuthController(this.repository, this.store, {DateTime Function()? clock})
    : _clock = clock ?? DateTime.now;
  final AuthRepository repository;
  final SessionStore store;
  final DateTime Function() _clock;
  AuthPhase phase = AuthPhase.restoring;
  AccountSession? session;
  ApiFailure? failure;
  bool busy = false;
  bool _disposed = false;
  int _generation = 0;
  Future<void> _writes = Future<void>.value();

  Future<void> _persist(AccountSession value, int generation) {
    final task = _writes.then((_) async {
      if (generation == _generation && !_disposed) await store.write(value);
    });
    _writes = task.catchError((Object _) {});
    return task;
  }

  Future<void> _clear() {
    final task = _writes.then((_) => store.clear());
    _writes = task.catchError((Object _) {});
    return task;
  }

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  Future<void> restore() async {
    final generation = ++_generation;
    failure = null;
    try {
      final saved = await store.read();
      if (generation != _generation || _disposed) return;
      if (saved == null) {
        phase = AuthPhase.signedOut;
        _notify();
        return;
      }
      final fresh =
          saved.expiresAt.isAfter(_clock().add(const Duration(minutes: 1)))
          ? saved
          : await repository.refresh(saved);
      if (generation != _generation || _disposed) return;
      if (fresh.uid != saved.uid) {
        throw const ApiFailure('identity_changed', 'Please sign in again.');
      }
      await _persist(fresh, generation);
      if (generation != _generation || _disposed) return;
      session = fresh;
      phase = AuthPhase.signedIn;
    } on ApiFailure catch (error) {
      if (generation != _generation || _disposed) return;
      failure = error;
      if (error.status == 401 || error.code == 'identity_changed') {
        try {
          await _clear();
        } catch (_) {
          if (generation == _generation && !_disposed) {
            failure = const ApiFailure(
              'session_cleanup_failed',
              'Could not remove the expired session. Please retry sign-out.',
            );
          }
        }
      }
      if (generation != _generation || _disposed) return;
      phase = AuthPhase.signedOut;
    } catch (_) {
      if (generation != _generation || _disposed) return;
      failure = const ApiFailure(
        'session_unavailable',
        'Could not restore your session. Please try again.',
      );
      phase = AuthPhase.signedOut;
    }
    _notify();
  }

  Future<void> signIn({
    String? email,
    String? password,
    bool create = false,
    bool google = false,
  }) async {
    if (busy || _disposed) return;
    final generation = ++_generation;
    busy = true;
    failure = null;
    _notify();
    try {
      final fresh = google
          ? await repository.google()
          : email == null
          ? await repository.guest()
          : create && session?.isGuest == true
          ? await repository.link(await validSession(), email, password ?? '')
          : await repository.email(email, password ?? '', create: create);
      if (generation != _generation || _disposed) return;
      await _persist(fresh, generation);
      if (generation != _generation || _disposed) return;
      session = fresh;
      phase = AuthPhase.signedIn;
    } on ApiFailure catch (error) {
      if (generation == _generation && !_disposed) failure = error;
    } catch (_) {
      if (generation == _generation && !_disposed) {
        failure = const ApiFailure(
          'sign_in_failed',
          'Could not complete sign-in. Please try again.',
        );
      }
    } finally {
      if (generation == _generation) {
        busy = false;
        _notify();
      }
    }
  }

  Future<AccountSession>? _refresh;
  Future<AccountSession> validSession() async {
    final current = session;
    if (current == null) {
      throw const ApiFailure(
        'auth_required',
        'Please sign in again.',
        status: 401,
      );
    }
    if (current.expiresAt.isAfter(_clock().add(const Duration(minutes: 1)))) {
      return current;
    }
    if (_refresh != null) return _refresh!;
    final generation = _generation;
    final future = () async {
      final refreshed = await repository.refresh(current);
      final fresh = refreshed.withProfile(
        photoUrl: current.photoUrl?.startsWith('file:') == true
            ? current.photoUrl
            : null,
      );
      if (_disposed || generation != _generation || fresh.uid != current.uid) {
        throw const ApiFailure(
          'account_changed',
          'Account changed. Retry this request.',
        );
      }
      await _persist(fresh, generation);
      if (_disposed || generation != _generation) {
        throw const ApiFailure(
          'account_changed',
          'Account changed. Retry this request.',
        );
      }
      session = fresh;
      _notify();
      return fresh;
    }();
    _refresh = future;
    try {
      return await future;
    } finally {
      if (identical(_refresh, future)) _refresh = null;
    }
  }

  Future<void> updateProfile({
    String? name,
    String? handle,
    String? photoUrl,
    List<String>? allergens,
    String? expectedUid,
  }) async {
    final current = session;
    if (current == null ||
        (expectedUid != null && current.uid != expectedUid)) {
      throw const ApiFailure('auth_required', 'Please sign in again.');
    }
    final generation = _generation;
    final updated = current.withProfile(
      name: name,
      handle: handle,
      photoUrl: photoUrl,
      allergens: allergens,
    );
    await _persist(updated, generation);
    if (_disposed || generation != _generation) return;
    session = updated;
    _notify();
  }

  Future<void> signOut() async {
    ++_generation;
    _refresh = null;
    session = null;
    phase = AuthPhase.signedOut;
    failure = null;
    busy = false;
    _notify();
    try {
      await _clear();
    } catch (_) {
      failure = const ApiFailure(
        'sign_out_incomplete',
        'Could not remove the saved session. Please retry sign-out.',
      );
      _notify();
    }
  }

  @override
  void dispose() {
    _disposed = true;
    ++_generation;
    super.dispose();
  }
}
