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
import '../design/widgets/edge_blur.dart';
import '../design/tokens.dart';

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

class _MobileShellState extends State<MobileShell>
    with SingleTickerProviderStateMixin {
  late final repository = AccountRepository(
    widget.auth,
    widget.preferences.store,
  );
  late final data = AccountState(repository);
  FoodLibrary? _library;
  String? _error;
  bool _onboarded = false, _ready = false, _revealing = false;
  int _tab = 0;
  int? _leavingTab;
  late final AnimationController _tabMotion =
      AnimationController(
        vsync: this,
        duration: MotionTokens.sheetEnter,
        value: 1,
      )..addStatusListener((status) {
        if (status == AnimationStatus.completed &&
            mounted &&
            _leavingTab != null) {
          setState(() => _leavingTab = null);
        }
      });
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

  void _select(int tab) {
    if (tab == _tab || tab < 0 || tab > 3) return;
    final reduced = MediaQuery.disableAnimationsOf(context);
    setState(() {
      _leavingTab = reduced ? null : _tab;
      _tab = tab;
    });
    if (reduced) {
      _tabMotion.value = 1;
    } else {
      _tabMotion.forward(from: 0);
    }
  }

  Route<T> _detailRoute<T>({required WidgetBuilder builder}) =>
      PageRouteBuilder<T>(
        transitionDuration: MotionTokens.sheetEnter,
        reverseTransitionDuration: MotionTokens.sheetExit,
        pageBuilder: (context, _, _) => builder(context),
        transitionsBuilder: (context, animation, secondary, child) {
          final reduced = MediaQuery.disableAnimationsOf(context);
          if (reduced) return child;
          return AnimatedBuilder(
            animation: animation,
            child: RepaintBoundary(child: child),
            builder: (context, child) {
              final v = Curves.easeOutCubic.transform(animation.value);
              final away = 1 - v;
              return Opacity(
                opacity: v,
                child: Transform.translate(
                  offset: Offset(0, 22 * away),
                  child: Transform.scale(scale: 1 + .03 * away, child: child),
                ),
              );
            },
          );
        },
      );
  Future<void> _result(ProductResult result, {bool sample = false}) async {
    await Navigator.of(context).push<void>(
      _detailRoute<void>(
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
      _detailRoute<ProductResult>(
        builder: (_) => ScanScreen(repository: repository),
      ),
    );
    if (!mounted || result == null) return;
    data.load();
    await _result(result);
  }

  Future<void> _upgrade() async {
    await Navigator.of(context).push<void>(
      _detailRoute<void>(
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
      _detailRoute<bool>(
        builder: (_) => EditProfileScreen(
          repository: repository,
          store: widget.preferences.store,
        ),
      ),
    );
  }

  Future<void> _settings() async {
    await Navigator.of(context).push<void>(
      _detailRoute<void>(
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
    _tabMotion.dispose();
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
        haptics: widget.preferences.haptics,
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
                child: Stack(
                  children: [
                    for (var i = 0; i < screens.length; i++)
                      Positioned.fill(
                        child: Offstage(
                          offstage: i != _tab && i != _leavingTab,
                          child: TickerMode(
                            enabled: i == _tab,
                            child: AnimatedBuilder(
                              animation: _tabMotion,
                              child: RepaintBoundary(child: screens[i]),
                              builder: (context, child) {
                                if (_leavingTab == null) return child!;
                                final incoming = i == _tab;
                                final direction = _tab > _leavingTab!
                                    ? 1.0
                                    : -1.0;
                                final v = _tabMotion.value;
                                final visibility = incoming ? v : 1 - v;
                                final x = incoming
                                    ? 26 * direction * (1 - v)
                                    : -18 * direction * v;
                                return IgnorePointer(
                                  ignoring: !incoming,
                                  child: ExcludeSemantics(
                                    excluding: !incoming,
                                    child: Opacity(
                                      opacity: visibility,
                                      child: Transform.translate(
                                        offset: Offset(x, 0),
                                        child: Transform.scale(
                                          scale: incoming
                                              ? 1 + .03 * (1 - v)
                                              : 1 - .04 * v,
                                          child: child,
                                        ),
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            if (!_revealing && MediaQuery.viewInsetsOf(context).bottom < 60)
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: EdgeBlur(
                  height: 128 + MediaQuery.viewPaddingOf(context).bottom,
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
