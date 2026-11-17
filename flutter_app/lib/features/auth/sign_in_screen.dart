import 'package:material_ui/material_ui.dart';

import '../../design/motion/entrance.dart';
import '../../design/widgets/content_frame.dart';
import '../../design/widgets/eatinformed_mark.dart';
import 'auth_controller.dart';

class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key, required this.auth});
  final AuthController auth;
  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  final _email = TextEditingController(), _password = TextEditingController();
  final _form = GlobalKey<FormState>();
  bool _showEmail = false;
  Future<void> _submit() async {
    if (_form.currentState?.validate() ?? false) {
      FocusScope.of(context).unfocus();
      await widget.auth.signIn(email: _email.text, password: _password.text);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: ContentFrame(
        slivers: [
          SliverToBoxAdapter(
            child: Form(
              key: _form,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 36),
                  Entrance(
                    child: Row(
                      children: [
                        EatInformedMark(
                          leaf: theme.colorScheme.primary,
                          ink: theme.colorScheme.onSurface,
                          size: 32,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'EatInformed',
                            style: theme.textTheme.titleLarge,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 48),
                  Entrance(
                    index: 1,
                    child: Text(
                      'Know what\nyou eat.',
                      style: theme.textTheme.headlineLarge,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Entrance(
                    index: 2,
                    child: Text(
                      'Read food labels, explore ingredients and keep your scan history together.',
                      style: theme.textTheme.bodyLarge,
                    ),
                  ),
                  const SizedBox(height: 36),
                  if (widget.auth.failure != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 20),
                      child: Semantics(
                        liveRegion: true,
                        child: Text(
                          widget.auth.failure.toString(),
                          style: TextStyle(color: theme.colorScheme.error),
                        ),
                      ),
                    ),
                  if (_showEmail) ...[
                    TextFormField(
                      controller: _email,
                      decoration: const InputDecoration(labelText: 'Email'),
                      autofillHints: const [AutofillHints.email],
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      validator: (value) => value != null && value.contains('@')
                          ? null
                          : 'Enter your email address.',
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _password,
                      decoration: const InputDecoration(labelText: 'Password'),
                      obscureText: true,
                      autofillHints: const [AutofillHints.password],
                      onFieldSubmitted: (_) => _submit(),
                      validator: (value) => value != null && value.length >= 6
                          ? null
                          : 'Enter your password.',
                    ),
                    const SizedBox(height: 20),
                    FilledButton(
                      onPressed: widget.auth.busy ? null : _submit,
                      child: const Text('Sign in'),
                    ),
                  ] else
                    Entrance(
                      index: 3,
                      child: FilledButton(
                        onPressed: widget.auth.busy
                            ? null
                            : () => setState(() => _showEmail = true),
                        child: const Text('Sign in with email'),
                      ),
                    ),
                  const SizedBox(height: 12),
                  Entrance(
                    index: 4,
                    child: OutlinedButton(
                      onPressed: widget.auth.busy
                          ? null
                          : () => widget.auth.signIn(),
                      child: const Text('Continue as guest'),
                    ),
                  ),
                  if (widget.auth.busy)
                    const Padding(
                      padding: EdgeInsets.all(20),
                      child: Center(
                        child: CircularProgressIndicator(
                          semanticsLabel: 'Signing in',
                        ),
                      ),
                    ),
                  const SizedBox(height: 24),
                  Text(
                    'AI interpretations can be incomplete. Always check the original label.',
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }
}
