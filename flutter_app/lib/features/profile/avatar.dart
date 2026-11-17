import 'dart:io';

import 'package:material_ui/material_ui.dart';

class AccountAvatar extends StatelessWidget {
  const AccountAvatar({
    super.key,
    required this.name,
    this.photo,
    this.size = 82,
  });
  final String name;
  final String? photo;
  final double size;
  @override
  Widget build(BuildContext context) {
    final fallback = Center(
      child: Text(
        name.isEmpty ? '?' : name.characters.first.toUpperCase(),
        style: TextStyle(
          fontSize: size * .4,
          color: Theme.of(context).colorScheme.primary,
        ),
      ),
    );
    Widget image = fallback;
    if (photo != null && photo!.isNotEmpty) {
      final uri = Uri.tryParse(photo!);
      if (uri?.scheme == 'https') {
        image = Image.network(
          photo!,
          fit: BoxFit.cover,
          errorBuilder: (_, error, stack) => fallback,
        );
      } else if (uri?.scheme == 'file') {
        image = Image.file(
          File.fromUri(uri!),
          fit: BoxFit.cover,
          errorBuilder: (_, error, stack) => fallback,
        );
      }
    }
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        border: Border.all(
          color: Theme.of(context).colorScheme.primary,
          width: 2,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: image,
    );
  }
}
