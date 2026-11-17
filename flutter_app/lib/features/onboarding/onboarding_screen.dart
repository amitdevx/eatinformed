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

  Future<void> _pickAvatar() async {
    final session = widget.repository.auth.session;
    if (session == null || session.isGuest) return;
    try {
      final photo = await pickAvatar(session.uid);
      if (photo == null ||
          !mounted ||
          widget.repository.auth.session?.uid != session.uid) {
        return;
      }
      await widget.store.write('avatar:${session.uid}', photo);
      await widget.repository.auth.updateProfile(
        photoUrl: photo,
        expectedUid: session.uid,
      );
      if (mounted) setState(() => _error = null);
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'Could not choose a photo. Please try again.');
      }
    }
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
          title: const Text('EatInformed'),
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
          key: ValueKey(_step),
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
                        'What should we call you?',
                        'Choose your avatar',
                        'You are ready to explore',
                      ][_step],
                    ),
                    if (_step == 0) ...[
                      const SizedBox(height: 24),
                      Text(
                        session.name,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      Text(
                        session.isGuest
                            ? 'Guest profile customization is locked.'
                            : session.handle == null
                            ? 'Choose a handle for your Food Passport.'
                            : '@${session.handle}',
                      ),
                      if (!session.isGuest) ...[
                        const SizedBox(height: 16),
                        OutlinedButton(
                          onPressed: _edit,
                          child: const Text('Choose name and handle'),
                        ),
                      ],
                    ],
                    if (_step == 1) ...[
                      const SizedBox(height: 24),
                      Center(
                        child: Semantics(
                          button: !session.isGuest,
                          label: session.isGuest
                              ? 'Guest avatar'
                              : 'Choose your avatar',
                          child: GestureDetector(
                            onTap: session.isGuest ? null : _pickAvatar,
                            child: AccountAvatar(
                              name: session.name,
                              photo: session.photoUrl,
                              size: 100,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      if (session.isGuest)
                        const Text(
                          'Create an account to choose a profile photo.',
                        )
                      else
                        OutlinedButton(
                          onPressed: _pickAvatar,
                          child: const Text('Choose your avatar'),
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
