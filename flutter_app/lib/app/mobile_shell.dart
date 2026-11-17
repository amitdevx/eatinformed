import 'package:material_ui/material_ui.dart';

import '../core/data/account_repository.dart';
import '../core/data/account_state.dart';
import '../core/data/models.dart';
import '../core/data/preferences.dart';
import '../features/auth/auth_controller.dart';
import '../features/auth/sign_in_screen.dart';
import '../features/history/history_screen.dart';
import '../features/home/home_screen.dart';
import '../features/library/guide_screen.dart';
import '../features/library/library.dart';
import '../features/onboarding/onboarding_screen.dart';
import '../features/profile/edit_profile.dart';
import '../features/profile/profile_screen.dart';
import '../features/results/result_screen.dart';
import '../features/scan/scan_screen.dart';
import '../features/settings/settings_screen.dart';
import '../design/widgets/floating_navigation.dart';

class MobileShell extends StatefulWidget {
  const MobileShell({
    super.key,
    required this.auth,
    required this.preferences,
    this.library,
  });
  final AuthController auth;
  final AppPreferences preferences;
  final FoodLibrary? library;
  @override
  State<MobileShell> createState() => _MobileShellState();
}

class _MobileShellState extends State<MobileShell> {
  late final repository = AccountRepository(
    widget.auth,
    widget.preferences.store,
  );
  late final data = AccountState(repository);
  FoodLibrary? _library;
  String? _error;
  bool _onboarded = false, _ready = false, _revealing = false;
  int _tab = 0;
  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    try {
      final library = widget.library ?? await FoodLibrary.load();
      final uid = widget.auth.session!.uid;
      final completed =
          await widget.preferences.store.read('onboarding:$uid') == 'true';
      if (!mounted) return;
      setState(() {
        _library = library;
        _onboarded = completed;
        _ready = true;
        _error = null;
      });
      data.load();
      // Reconcile server-owned profile without replacing the authenticated identity.
      try {
        final response = await repository.profile();
        final profile = response['profile'];
        if (!mounted || widget.auth.session?.uid != uid || profile is! Map) {
          return;
        }
        final avatar = await widget.preferences.store.read('avatar:$uid');
        if (!mounted || widget.auth.session?.uid != uid) return;
        await widget.auth.updateProfile(
          name: profile['name'] as String?,
          handle: profile['handle'] as String?,
          allergens: (profile['allergens'] as List?)?.cast<String>(),
          photoUrl: avatar,
        );
      } catch (_) {
        /* Existing verified session remains usable; edit errors are shown by that flow. */
      }
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'Could not load the app. Please retry.');
      }
    }
  }

  void _select(int tab) => setState(() => _tab = tab);
  Future<void> _result(ProductResult result, {bool sample = false}) async {
    await Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) => ResultScreen(
          result: result,
          library: _library!,
          sample: sample,
          allergens: widget.auth.session?.allergens ?? const [],
          onScan: _scan,
        ),
      ),
    );
  }

  Future<void> _scan() async {
    final result = await Navigator.of(context).push<ProductResult>(
      MaterialPageRoute(builder: (_) => ScanScreen(repository: repository)),
    );
    if (!mounted || result == null) return;
    data.load();
    await _result(result);
  }

  Future<void> _upgrade() async {
    await Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) => SignInScreen(auth: widget.auth, upgrade: true),
      ),
    );
  }

  Future<void> _edit() async {
    if (widget.auth.session!.isGuest) {
      await _upgrade();
      return;
    }
    await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => EditProfileScreen(
          repository: repository,
          store: widget.preferences.store,
        ),
      ),
    );
  }

  Future<void> _settings() async {
    await Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) => SettingsScreen(
          repository: repository,
          state: data,
          preferences: widget.preferences,
          onEdit: _edit,
          onGuide: () {
            Navigator.of(context).pop();
            _select(2);
          },
        ),
      ),
    );
  }

  @override
  void dispose() {
    data.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return Scaffold(
        body: Center(
          child: TextButton(onPressed: _initialize, child: Text(_error!)),
        ),
      );
    }
    if (!_ready) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (!_onboarded) {
      return OnboardingScreen(
        repository: repository,
        store: widget.preferences.store,
        onComplete: () => setState(() => _onboarded = true),
      );
    }
    final session = widget.auth.session!;
    final screens = <Widget>[
      HomeScreen(
        name: session.name,
        state: data,
        library: _library!,
        onScan: _scan,
        onTab: _select,
        onSample: (r) => _result(r, sample: true),
      ),
      HistoryScreen(
        state: data,
        onOpen: (r) => _result(r.result),
        onScan: _scan,
      ),
      GuideScreen(library: _library!),
      ProfileScreen(
        session: session,
        data: data,
        preferences: widget.preferences,
        onEdit: _edit,
        onSettings: _settings,
        onHistory: () => _select(1),
        onOpen: (r) => _result(r.result),
        onUpgrade: _upgrade,
        onReveal: (value) {
          if (mounted && value != _revealing) {
            setState(() => _revealing = value);
          }
        },
      ),
    ];
    return PopScope(
      canPop: _tab == 0 && !_revealing,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop && !_revealing) _select(0);
      },
      child: Scaffold(
        body: Stack(
          children: [
            Positioned.fill(
              child: SafeArea(
                bottom: false,
                child: IndexedStack(
                  index: _tab,
                  children: [
                    for (var i = 0; i < screens.length; i++)
                      TickerMode(enabled: i == _tab, child: screens[i]),
                  ],
                ),
              ),
            ),
            if (!_revealing && MediaQuery.viewInsetsOf(context).bottom < 60)
              Positioned(
                left: 24,
                right: 24,
                bottom: 18 + MediaQuery.viewPaddingOf(context).bottom,
                child: RepaintBoundary(
                  child: FloatingNavigation(
                    selected: _tab,
                    onSelect: _select,
                    onScan: _scan,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
