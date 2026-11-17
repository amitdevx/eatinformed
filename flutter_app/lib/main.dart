import 'package:material_ui/material_ui.dart';

import 'app/app.dart';
import 'app/config.dart';
import 'core/network/api_client.dart';
import 'core/session/session_store.dart';
import 'features/auth/auth_controller.dart';
import 'features/auth/auth_repository.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final api = ApiClient(AppConfig.environment());
  final auth = AuthController(AuthRepository(api), SecureSessionStore());
  runApp(EatInformedApp(auth: auth));
  auth.restore();
}
