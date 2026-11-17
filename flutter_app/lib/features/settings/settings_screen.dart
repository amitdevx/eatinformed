import 'package:material_ui/material_ui.dart';

import '../../core/data/account_repository.dart';
import '../../core/data/account_state.dart';
import '../../core/data/preferences.dart';
import '../../core/data/sharing.dart';
import '../../design/widgets/content_frame.dart';
import '../../design/widgets/surfaces.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({
    super.key,
    required this.repository,
    required this.state,
    required this.preferences,
    required this.onGuide,
    required this.onEdit,
  });
  final AccountRepository repository;
  final AccountState state;
  final AppPreferences preferences;
  final VoidCallback onGuide, onEdit;
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  String? _message;
  bool _busy = false;
  Future<void> _run(Future<void> Function() action) async {
    setState(() => _busy = true);
    try {
      await action();
    } catch (e) {
      if (mounted) setState(() => _message = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<bool> _confirm(String title, String message) async =>
      await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text(title),
          content: Text(message),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Confirm'),
            ),
          ],
        ),
      ) ??
      false;
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: widget.preferences,
    builder: (context, _) => Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ContentFrame(
        slivers: [
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const PageHeading(
                  'Settings',
                  subtitle: 'Preferences, appearance and account data',
                ),
                if (_busy) const LinearProgressIndicator(),
                if (_message != null) Notice(_message!),
                SectionCard(
                  child: Column(
                    children: [
                      Text(
                        'APPEARANCE & HAPTICS',
                        style: Theme.of(context).textTheme.labelLarge,
                      ),
                      DropdownButtonFormField<ThemeMode>(
                        initialValue: widget.preferences.theme,
                        decoration: const InputDecoration(
                          labelText: 'Interface Theme',
                        ),
                        items: const [
                          DropdownMenuItem(
                            value: ThemeMode.system,
                            child: Text('System'),
                          ),
                          DropdownMenuItem(
                            value: ThemeMode.light,
                            child: Text('Light'),
                          ),
                          DropdownMenuItem(
                            value: ThemeMode.dark,
                            child: Text('Dark'),
                          ),
                        ],
                        onChanged: (value) {
                          if (value != null) {
                            _run(() => widget.preferences.setTheme(value));
                          }
                        },
                      ),
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('Haptic Tactile Feedback'),
                        subtitle: const Text(
                          'Subtle tactile responses on clicks & scans',
                        ),
                        value: widget.preferences.haptics,
                        onChanged: (v) =>
                            _run(() => widget.preferences.setHaptics(v)),
                      ),
                    ],
                  ),
                ),
                SectionCard(
                  child: Column(
                    children: [
                      const Text('DIETARY & SENSITIVITY'),
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('Strict Allergen Alerts'),
                        subtitle: const Text(
                          'Configure saved allergen preferences',
                        ),
                        onTap: widget.onEdit,
                      ),
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('Offline Additive Protection'),
                        subtitle: const Text(
                          'Open the offline additive reference',
                        ),
                        onTap: widget.onGuide,
                      ),
                    ],
                  ),
                ),
                SectionCard(
                  child: Column(
                    children: [
                      const Text('DATA & PORTABILITY'),
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('Export Scan History (JSON)'),
                        subtitle: const Text(
                          'Download or share your scan records',
                        ),
                        onTap: _busy
                            ? null
                            : () => _run(() async {
                                final records = await widget.repository.history(
                                  offline: false,
                                );
                                if (!context.mounted) return;
                                await shareJson(context, {
                                  'schemaVersion': 2,
                                  'appName': 'EatInformed',
                                  'exportedAt': DateTime.now()
                                      .toIso8601String(),
                                  'itemCount': records.length,
                                  'scans': records
                                      .map((e) => e.toJson())
                                      .toList(),
                                });
                              }),
                      ),
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('Clear Local Scan Cache'),
                        subtitle: const Text(
                          'Removes downloaded scan records from this device',
                        ),
                        onTap: _busy
                            ? null
                            : () => _run(() async {
                                if (await _confirm(
                                  'Clear Local Scan Cache',
                                  'Saved scans stay in your account and sync again when History opens.',
                                )) {
                                  await widget.repository.clearCache();
                                  if (mounted) {
                                    setState(
                                      () => _message = 'Local cache cleared.',
                                    );
                                  }
                                }
                              }),
                      ),
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('Delete Account History'),
                        subtitle: const Text(
                          'Deletes saved reports across synced devices',
                        ),
                        onTap: _busy
                            ? null
                            : () => _run(() async {
                                if (await _confirm(
                                  'Delete Account History',
                                  'Delete all saved scan reports from your account? This cannot be undone.',
                                )) {
                                  await widget.state.deleteAll();
                                  if (mounted) {
                                    setState(
                                      () =>
                                          _message = 'Account history deleted.',
                                    );
                                  }
                                }
                              }),
                      ),
                    ],
                  ),
                ),
                SectionCard(
                  child: Column(
                    children: [
                      const Text('DIAGNOSTICS & SYSTEM STATUS'),
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('Backend reachability'),
                        subtitle: const Text(
                          'Checks the API process, not AI-provider readiness',
                        ),
                        trailing: TextButton(
                          onPressed: _busy
                              ? null
                              : () => _run(() async {
                                  final timer = Stopwatch()..start();
                                  await widget.repository.auth.repository.api
                                      .request('GET', '/api/scan');
                                  if (mounted) {
                                    setState(
                                      () => _message =
                                          'Server is online (${timer.elapsedMilliseconds}ms).',
                                    );
                                  }
                                }),
                          child: const Text('Ping'),
                        ),
                      ),
                      Text(
                        'Additive Reference: 22 entries',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
                OutlinedButton(
                  onPressed: _busy
                      ? null
                      : () => _run(() async {
                          if (await _confirm(
                            'Sign Out',
                            'Are you sure you want to sign out of your EatInformed account?',
                          )) {
                            await widget.repository.clearCache();
                            await widget.repository.auth.signOut();
                          }
                        }),
                  child: const Text('Sign out'),
                ),
                const SizedBox(height: 20),
                Text(
                  'EatInformed Flutter Preview',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => showLicensePage(
                    context: context,
                    applicationName: 'EatInformed',
                  ),
                  child: const Text('Open-source notices'),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}
