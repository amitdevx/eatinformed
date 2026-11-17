import 'package:material_ui/material_ui.dart';
import 'package:shared_preferences/shared_preferences.dart';

abstract interface class PreferenceStore {
  Future<String?> read(String key);
  Future<void> write(String key, String? value);
}

class DiskPreferences implements PreferenceStore {
  final _prefs = SharedPreferencesAsync();
  @override
  Future<String?> read(String key) => _prefs.getString(key);
  @override
  Future<void> write(String key, String? value) async {
    if (value == null) {
      await _prefs.remove(key);
    } else {
      await _prefs.setString(key, value);
    }
  }
}

class MemoryPreferences implements PreferenceStore {
  final values = <String, String>{};
  @override
  Future<String?> read(String key) async => values[key];
  @override
  Future<void> write(String key, String? value) async {
    if (value == null) {
      values.remove(key);
    } else {
      values[key] = value;
    }
  }
}

class AppPreferences extends ChangeNotifier {
  AppPreferences(this.store);
  final PreferenceStore store;
  ThemeMode theme = ThemeMode.system;
  bool haptics = true;
  Future<void> load() async {
    final mode = await store.read('theme');
    theme = ThemeMode.values.firstWhere(
      (e) => e.name == mode,
      orElse: () => ThemeMode.system,
    );
    haptics = await store.read('haptics') != 'false';
    notifyListeners();
  }

  Future<void> setTheme(ThemeMode value) async {
    await store.write('theme', value.name);
    theme = value;
    notifyListeners();
  }

  Future<void> setHaptics(bool value) async {
    await store.write('haptics', '$value');
    haptics = value;
    notifyListeners();
  }
}
