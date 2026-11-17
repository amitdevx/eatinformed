import 'package:material_ui/material_ui.dart';

import '../../core/session/session.dart';
import '../../design/widgets/content_frame.dart';

/// First authenticated boundary. Dashboard and Profile replace this during porting.
class AccountScreen extends StatelessWidget {
  const AccountScreen({
    super.key,
    required this.session,
    required this.onSignOut,
    required this.themeMode,
    required this.onThemeChanged,
  });
  final AccountSession session;
  final VoidCallback onSignOut;
  final ThemeMode themeMode;
  final ValueChanged<ThemeMode> onThemeChanged;
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('EatInformed')),
    body: ContentFrame(
      slivers: [
        SliverList.list(
          children: [
            Text(
              session.name,
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 12),
            Text(session.isGuest ? 'Guest account' : session.email),
            const SizedBox(height: 32),
            DropdownButtonFormField<ThemeMode>(
              initialValue: themeMode,
              decoration: const InputDecoration(labelText: 'Appearance'),
              items: const [
                DropdownMenuItem(
                  value: ThemeMode.system,
                  child: Text('System'),
                ),
                DropdownMenuItem(value: ThemeMode.light, child: Text('Light')),
                DropdownMenuItem(value: ThemeMode.dark, child: Text('Dark')),
              ],
              onChanged: (value) {
                if (value != null) onThemeChanged(value);
              },
            ),
            const SizedBox(height: 24),
            OutlinedButton(onPressed: onSignOut, child: const Text('Sign out')),
          ],
        ),
      ],
    ),
  );
}
