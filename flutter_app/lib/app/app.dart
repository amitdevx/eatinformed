import 'package:material_ui/material_ui.dart';

import '../design/tokens.dart';
import '../features/account/account_screen.dart';
import '../features/auth/auth_controller.dart';
import '../features/auth/sign_in_screen.dart';

class EatInformedApp extends StatefulWidget {
  const EatInformedApp({super.key, required this.auth});
  final AuthController auth;
  @override
  State<EatInformedApp> createState() => _EatInformedAppState();
}

class _EatInformedAppState extends State<EatInformedApp> {
  ThemeMode _theme = ThemeMode.system;
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: widget.auth,
    builder: (context, _) => MaterialApp(
      title: 'EatInformed',
      debugShowCheckedModeBanner: false,
      theme: EatTheme.light,
      darkTheme: EatTheme.dark,
      themeMode: _theme,
      // Replace the entire navigation scope on identity changes. Auth routes cannot survive logout.
      home: Navigator(
        key: ValueKey('${widget.auth.phase}:${widget.auth.session?.uid}'),
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
              AuthPhase.signedIn => AccountScreen(
                session: widget.auth.session!,
                onSignOut: widget.auth.signOut,
                themeMode: _theme,
                onThemeChanged: (value) => setState(() => _theme = value),
              ),
            },
          ),
        ],
        onDidRemovePage: (_) {},
      ),
    ),
  );
}
