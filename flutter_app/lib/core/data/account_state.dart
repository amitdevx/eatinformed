import 'package:flutter/foundation.dart';

import '../network/api_failure.dart';
import 'account_repository.dart';
import 'models.dart';

class AccountState extends ChangeNotifier {
  AccountState(this.repository);
  final AccountRepository repository;
  List<ScanRecord>? records;
  Quota? quota;
  String? error;
  bool loading = false, offline = false, _disposed = false;
  int _generation = 0;
  Future<void> load() async {
    final generation = ++_generation;
    loading = true;
    error = null;
    notifyListeners();
    try {
      final result = await repository.history();
      if (_disposed || generation != _generation) return;
      records = result;
      offline = false;
    } on OfflineHistory catch (e) {
      if (!_disposed && generation == _generation) {
        records = e.items;
        offline = true;
        error = 'Offline: showing your recent cached reports. Statistics cover this cache only.';
      }
    } catch (e) {
      if (!_disposed && generation == _generation) {
        error = e is ApiFailure
            ? e.toString()
            : 'Could not load scan history. Please try again.';
      }
    }
    if (_disposed || generation != _generation) return;
    loading = false;
    notifyListeners();
    try {
      final value = await repository.quota();
      if (!_disposed && generation == _generation) {
        quota = value;
        notifyListeners();
      }
    } catch (_) {
      /* Quota remains unknown; scans still enforce it server-side. */
    }
  }

  Future<void> delete(String id) async {
    await repository.delete(id);
    await load();
  }

  Future<void> deleteAll() async {
    // A complete fresh server ledger is required; cached records are never a deletion plan.
    final all = await repository.history(offline: false);
    for (final item in all) {
      await repository.delete(item.id);
    }
    await load();
  }

  @override
  void dispose() {
    _disposed = true;
    ++_generation;
    super.dispose();
  }
}
