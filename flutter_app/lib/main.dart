import 'package:material_ui/material_ui.dart';

import 'app/app.dart';
import 'core/data/preferences.dart';
import 'app/config.dart';
import 'core/network/api_client.dart';
import 'core/session/session_store.dart';
import 'features/auth/auth_controller.dart';
import 'features/auth/auth_repository.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final api = ApiClient(AppConfig.environment());
  final auth = AuthController(AuthRepository(api), SecureSessionStore());
  final preferences = AppPreferences(DiskPreferences());
  await preferences.load();
  runApp(EatInformedApp(auth: auth, preferences: preferences));
  auth.restore();
}
