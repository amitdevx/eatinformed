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
        body: SafeArea(
          bottom: false,
          child: IndexedStack(
            index: _tab,
            children: [
              for (var i = 0; i < screens.length; i++)
                TickerMode(enabled: i == _tab, child: screens[i]),
            ],
          ),
        ),
        bottomNavigationBar: _revealing
            ? null
            : SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 4, 12, 8),
                  child: Material(
                    elevation: 8,
                    borderRadius: BorderRadius.circular(28),
                    color: Theme.of(context).colorScheme.surfaceContainerHigh,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(
                        children: [
                          _destination(0, Icons.home_outlined, 'Home'),
                          _destination(1, Icons.history, 'History'),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: IconButton.filled(
                              onPressed: _scan,
                              tooltip: 'Scan food label',
                              icon: const Icon(Icons.document_scanner_outlined),
                            ),
                          ),
                          _destination(2, Icons.menu_book_outlined, 'Guide'),
                          _destination(3, Icons.person_outline, 'Profile'),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
      ),
    );
  }

  Widget _destination(int index, IconData icon, String label) => Expanded(
    child: Semantics(
      selected: _tab == index,
      child: Tooltip(
        message: label,
        child: InkWell(
          onTap: () => _select(index),
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 2),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                AnimatedContainer(
                  duration: MediaQuery.disableAnimationsOf(context)
                      ? Duration.zero
                      : const Duration(milliseconds: 180),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: _tab == index
                        ? Theme.of(context).colorScheme.primaryContainer
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Icon(icon, size: 22),
                ),
                const SizedBox(height: 2),
                Text(
                  label,
                  style: Theme.of(context).textTheme.labelSmall,
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}
