import 'package:material_ui/material_ui.dart';

import '../../core/data/account_repository.dart';
import '../../core/data/preferences.dart';
import '../../design/motion/entrance.dart';
import '../../design/widgets/content_frame.dart';
import '../../design/widgets/surfaces.dart';
import '../profile/avatar.dart';
import '../profile/edit_profile.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({
    super.key,
    required this.repository,
    required this.store,
    required this.onComplete,
  });
  final AccountRepository repository;
  final PreferenceStore store;
  final VoidCallback onComplete;
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  int _step = 0;
  String? _error;
  bool _saving = false;
  Future<void> _finish() async {
    setState(() => _saving = true);
    try {
      await widget.store.write(
        'onboarding:${widget.repository.auth.session!.uid}',
        'true',
      );
      widget.onComplete();
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'Could not finish setup. Please try again.');
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _edit() async {
    await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => EditProfileScreen(
          repository: widget.repository,
          store: widget.store,
          onboarding: true,
        ),
      ),
    );
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final session = widget.repository.auth.session!;
    return PopScope(
      canPop: _step == 0 && !_saving,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop && !_saving && _step > 0) setState(() => _step--);
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Welcome to EatInformed'),
          leading: _step == 0
              ? null
              : BackButton(onPressed: () => setState(() => _step--)),
          actions: [
            TextButton(
              onPressed: widget.repository.auth.signOut,
              child: const Text('Sign out'),
            ),
          ],
        ),
        body: ContentFrame(
          slivers: [
            SliverToBoxAdapter(
              child: Entrance(
                key: ValueKey(_step),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    LinearProgressIndicator(value: (_step + 1) / 3),
                    const SizedBox(height: 24),
                    PageHeading(
                      [
                        'Your food, informed.',
                        'Choose your avatar',
                        'Ready to get started',
                      ][_step],
                    ),
                    if (_step == 0) ...[
                      const Text('NOVA Classification'),
                      const Text(
                        'Detect ultra-processed formulations and additives instantly.',
                      ),
                      const SizedBox(height: 20),
                      const Text('Allergen Protection'),
                      const Text(
                        'Flag allergens and synthetic preservatives in real time.',
                      ),
                      const SizedBox(height: 20),
                      const Text('Nutrition Passport'),
                      const Text(
                        'Keep your saved food-label reports together across devices.',
                      ),
                      const SizedBox(height: 24),
                      Text(
                        session.name,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      Text(
                        session.email.isEmpty
                            ? 'Guest Explorer'
                            : session.email,
                      ),
                    ],
                    if (_step == 1) ...[
                      Center(
                        child: AccountAvatar(
                          name: session.name,
                          photo: session.photoUrl,
                          size: 100,
                        ),
                      ),
                      const SizedBox(height: 20),
                      if (session.isGuest)
                        const Text(
                          'Sign up with Google or email to choose your name and handle, customize your profile, and unlock higher scan limits.',
                        )
                      else
                        OutlinedButton(
                          onPressed: _edit,
                          child: const Text('Choose name, handle and avatar'),
                        ),
                    ],
                    if (_step == 2) ...[
                      Center(
                        child: AccountAvatar(
                          name: session.name,
                          photo: session.photoUrl,
                          size: 100,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        session.name,
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      if (session.handle != null) Text('@${session.handle}'),
                      Text(
                        session.isGuest
                            ? 'Guest profile customization is locked. You can create an account from Profile.'
                            : 'Your existing account and saved scans stay with you.',
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Food ratings are AI estimates. Check the original label, especially for allergens.',
                      ),
                    ],
                    if (_error != null) Notice(_error!),
                    const SizedBox(height: 32),
                    FilledButton(
                      onPressed: _saving
                          ? null
                          : () {
                              if (_step < 2) {
                                setState(() => _step++);
                              } else {
                                _finish();
                              }
                            },
                      child: Text(_step < 2 ? 'Continue' : 'Get Started'),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
