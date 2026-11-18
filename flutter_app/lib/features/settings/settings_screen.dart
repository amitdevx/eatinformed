import 'package:material_ui/material_ui.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

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
  late final Future<PackageInfo> _packageInfo = PackageInfo.fromPlatform();
  String? _message;
  bool _busy = false;
  Future<void> _run(
    Future<void> Function() action, {
    required String failure,
  }) async {
    if (_busy) return;
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      await action();
    } catch (_) {
      if (mounted) setState(() => _message = failure);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _chooseTheme() async {
    final chosen = await glassSheet<ThemeMode>(
      context,
      compact: true,
      child: Material(
        type: MaterialType.transparency,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Interface Theme',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            for (final (mode, label, icon) in [
              (ThemeMode.system, 'System', PhosphorIconsRegular.deviceMobile),
              (ThemeMode.dark, 'Dark', PhosphorIconsRegular.moon),
              (ThemeMode.light, 'Light', PhosphorIconsRegular.sun),
            ])
              ListTile(
                leading: Icon(icon),
                title: Text(label),
                selected: widget.preferences.theme == mode,
                trailing: widget.preferences.theme == mode
                    ? const Icon(PhosphorIconsRegular.checkCircle)
                    : null,
                onTap: () => Navigator.pop(context, mode),
              ),
          ],
        ),
      ),
    );
    if (chosen == null || !mounted || chosen == widget.preferences.theme) {
      return;
    }
    await _run(
      () => widget.preferences.setTheme(chosen),
      failure: 'Could not save the theme. Please try again.',
    );
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

  Widget _group(String title, List<Widget> children) => Padding(
    padding: const EdgeInsets.only(bottom: 20),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(8, 0, 0, 10),
          child: Text(title, style: Theme.of(context).textTheme.labelMedium),
        ),
        Card(
          clipBehavior: Clip.antiAlias,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: Column(children: children),
          ),
        ),
      ],
    ),
  );
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
                const SizedBox(height: 12),
                if (_busy) const LinearProgressIndicator(),
                if (_message != null) Notice(_message!),
                _group('APPEARANCE & HAPTICS', [
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(PhosphorIconsRegular.paintBrush),
                    title: const Text('Interface Theme'),
                    subtitle: Text(switch (widget.preferences.theme) {
                      ThemeMode.system => 'System',
                      ThemeMode.dark => 'Dark',
                      ThemeMode.light => 'Light',
                    }),
                    trailing: const Icon(PhosphorIconsRegular.caretRight),
                    onTap: _busy ? null : _chooseTheme,
                  ),
                  const Divider(height: 1),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    secondary: const Icon(PhosphorIconsRegular.vibrate),
                    title: const Text('Haptic Tactile Feedback'),
                    subtitle: const Text('Touch feedback on supported devices'),
                    value: widget.preferences.haptics,
                    onChanged: _busy
                        ? null
                        : (v) => _run(
                            () => widget.preferences.setHaptics(v),
                            failure: 'Could not save haptic preference.',
                          ),
                  ),
                ]),
                _group('FOOD & SENSITIVITIES', [
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(PhosphorIconsRegular.shieldWarning),
                    title: const Text('Allergen preferences'),
                    subtitle: Text(
                      widget.repository.auth.session?.isGuest == true
                          ? 'Create an account to save preferences'
                          : 'Choose ingredients to flag in scan results',
                    ),
                    trailing: const Icon(PhosphorIconsRegular.caretRight),
                    onTap: _busy ? null : widget.onEdit,
                  ),
                  const Divider(height: 1),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(PhosphorIconsRegular.bookOpen),
                    title: const Text('Additive dictionary'),
                    subtitle: const Text('Open the bundled additive reference'),
                    trailing: const Icon(PhosphorIconsRegular.caretRight),
                    onTap: _busy ? null : widget.onGuide,
                  ),
                ]),
                _group('DATA & PRIVACY', [
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(PhosphorIconsRegular.downloadSimple),
                    title: const Text('Export Scan History (JSON)'),
                    subtitle: const Text('Download or share your scan records'),
                    trailing: const Icon(PhosphorIconsRegular.caretRight),
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
                              'exportedAt': DateTime.now().toIso8601String(),
                              'itemCount': records.length,
                              'scans': records.map((e) => e.toJson()).toList(),
                            });
                          }, failure: 'Could not export scan history.'),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(PhosphorIconsRegular.trash),
                    title: const Text('Clear Local Scan Cache'),
                    subtitle: const Text(
                      'Removes downloaded scan records from this device',
                    ),
                    trailing: const Icon(PhosphorIconsRegular.caretRight),
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
                          }, failure: 'Could not clear the local cache.'),
                  ),
                ]),
                _group('DIAGNOSTICS', [
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(PhosphorIconsRegular.pulse),
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
                                      'API reachable (${timer.elapsedMilliseconds}ms).',
                                );
                              }
                            }, failure: 'API unreachable. Please try again.'),
                      child: const Text('Ping'),
                    ),
                  ),
                ]),
                OutlinedButton.icon(
                  onPressed: _busy
                      ? null
                      : () => _run(() async {
                          final guest =
                              widget.repository.auth.session?.isGuest == true;
                          if (await _confirm(
                            guest
                                ? 'Exit Guest Mode'
                                : 'Sign Out of EatInformed',
                            guest ? 'Exit guest mode on this device?' : 'Sign out of your EatInformed account on this device?',
                          )) {
                            await widget.repository.clearCache();
                            await widget.repository.auth.signOut();
                          }
                        }, failure: 'Could not sign out. Please try again.'),
                  icon: const Icon(PhosphorIconsRegular.signOut),
                  label: Text(
                    widget.repository.auth.session?.isGuest == true
                        ? 'Exit Guest Mode'
                        : 'Sign Out of EatInformed',
                  ),
                ),
                const SizedBox(height: 20),
                FutureBuilder<PackageInfo>(
                  future: _packageInfo,
                  builder: (context, snapshot) => Text(
                    snapshot.hasData
                        ? 'EatInformed ${snapshot.data!.version} (${snapshot.data!.buildNumber})'
                        : 'Version unavailable',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
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
