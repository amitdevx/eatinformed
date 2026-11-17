import 'package:material_ui/material_ui.dart';

import '../design/tokens.dart';
import '../core/data/preferences.dart';
import 'mobile_shell.dart';
import '../features/library/library.dart';
import '../features/auth/auth_controller.dart';
import '../features/auth/sign_in_screen.dart';

class EatInformedApp extends StatefulWidget {
  const EatInformedApp({
    super.key,
    required this.auth,
    this.preferences,
    this.library,
  });
  final AuthController auth;
  final AppPreferences? preferences;
  final FoodLibrary? library;
  @override
  State<EatInformedApp> createState() => _EatInformedAppState();
}

class _EatInformedAppState extends State<EatInformedApp> {
  late final _preferences =
      widget.preferences ?? AppPreferences(MemoryPreferences());
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: Listenable.merge([widget.auth, _preferences]),
    builder: (context, _) => MaterialApp(
      title: 'EatInformed',
      debugShowCheckedModeBanner: false,
      theme: EatTheme.light,
      darkTheme: EatTheme.dark,
      themeMode: _preferences.theme,
      // Replace the entire navigation scope on identity changes. Auth routes cannot survive logout.
      home: Navigator(
        key: ValueKey(
          '${widget.auth.phase}:${widget.auth.session?.uid}:${widget.auth.session?.isGuest}',
        ),
        pages: [
          MaterialPage<void>(
            child: switch (widget.auth.phase) {
              AuthPhase.restoring => const Scaffold(
                body: Center(
                  child: CircularProgressIndicator(
                    semanticsLabel: 'Restoring session',
                  ),
                ),
              ),
              AuthPhase.signedOut => SignInScreen(auth: widget.auth),
              AuthPhase.signedIn => MobileShell(
                auth: widget.auth,
                preferences: _preferences,
                library: widget.library,
              ),
            },
          ),
        ],
        onDidRemovePage: (_) {},
      ),
    ),
  );
}
