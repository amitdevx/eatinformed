import 'dart:io';

import 'package:crypto/crypto.dart';

import 'dart:convert';

import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/data/account_repository.dart';
import '../../core/data/preferences.dart';
import '../auth/auth_repository.dart';
import 'avatar.dart';

String suggestedHandle(String email) {
  final value = email
      .split('@')
      .first
      .toLowerCase()
      .replaceAll(RegExp('[^a-z0-9_]'), '_')
      .replaceAll(RegExp('_+'), '_');
  return value.length < 3
      ? '${value}reader'
      : value.substring(0, value.length.clamp(0, 20));
}

Future<String?> pickAvatar(String uid) async {
  final file = await ImagePicker().pickImage(
    source: ImageSource.gallery,
    maxWidth: 640,
    maxHeight: 640,
    imageQuality: 85,
    requestFullMetadata: false,
  );
  if (file == null) return null;
  final directory = await getApplicationDocumentsDirectory();
  final name = sha256.convert(utf8.encode(uid)).toString();
  final saved = await File(file.path)
      .copy('${directory.path}/avatar-$name-${randomKey()}.jpg');
  return saved.uri.toString();
}

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({
    super.key,
    required this.repository,
    required this.store,
    this.onboarding = false,
  });
  final AccountRepository repository;
  final PreferenceStore store;
  final bool onboarding;
  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  late final TextEditingController _name, _handle, _allergens;
  String? _photo, _error;
  bool _saving = false;
  @override
  void initState() {
    super.initState();
    final s = widget.repository.auth.session!;
    _name = TextEditingController(text: s.name);
    _handle = TextEditingController(text: s.handle ?? suggestedHandle(s.email));
    _allergens = TextEditingController(text: s.allergens.join(', '));
    _photo = s.photoUrl;
  }

  Future<void> _pick() async {
    try {
      final photo = await pickAvatar(widget.repository.auth.session!.uid);
      if (photo != null && mounted) setState(() => _photo = photo);
    } catch (_) {
      if (mounted) {
        setState(
          () => _error =
              'Could not open photo library. Please check permissions.',
        );
      }
    }
  }

  Future<void> _save() async {
    final name = _name.text.trim(), handle = _handle.text.trim().toLowerCase();
    if (name.isEmpty ||
        name.length > 80 ||
        !RegExp(r'^[a-z0-9_]{3,20}$').hasMatch(handle)) {
      setState(
        () => _error = 'Use a name and a handle with 3-20 letters, numbers or underscores.',
      );
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await widget.repository.saveProfile(
        name: name,
        handle: handle,
        allergens: _allergens.text
            .split(',')
            .map((e) => e.trim().toLowerCase())
            .where((e) => e.isNotEmpty)
            .toSet()
            .toList(),
      );
      final uid = widget.repository.auth.session!.uid;
      if (_photo != null) {
        await widget.store.write('avatar:$uid', _photo);
        await widget.repository.auth.updateProfile(photoUrl: _photo);
      }
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: Text(
        widget.onboarding ? 'Personalize your profile' : 'Edit Profile',
      ),
    ),
    body: SafeArea(
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
          24,
          24,
          24,
          24 + MediaQuery.viewInsetsOf(context).bottom,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Personalize your name, avatar, and personal allergen flags',
            ),
            const SizedBox(height: 24),
            Center(
              child: AccountAvatar(name: _name.text, photo: _photo),
            ),
            TextButton(
              onPressed: _pick,
              child: const Text('Choose your avatar'),
            ),
            TextField(
              controller: _name,
              decoration: const InputDecoration(labelText: 'Display name'),
              maxLength: 80,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _handle,
              decoration: const InputDecoration(
                labelText: 'Handle',
                prefixText: '@',
              ),
              maxLength: 20,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _allergens,
              decoration: const InputDecoration(
                labelText: 'Allergen preferences',
                hintText: 'milk, peanut, sesame',
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Preferences flag possible matches. Always check the original label and manufacturer.',
            ),
            const SizedBox(height: 12),
            const Text(
              'Custom avatars are stored on this device. Google account photos are used when available.',
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  _error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _saving ? null : _save,
              child: Text(_saving ? 'Saving' : 'Save Profile'),
            ),
          ],
        ),
      ),
    ),
  );
  @override
  void dispose() {
    _name.dispose();
    _handle.dispose();
    _allergens.dispose();
    super.dispose();
  }
}
