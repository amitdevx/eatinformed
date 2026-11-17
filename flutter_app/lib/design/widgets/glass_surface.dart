import 'dart:ui' as ui;

import 'package:material_ui/material_ui.dart';

/// Backdrop glass for the few places where content genuinely overlays a scene.
class GlassSurface extends StatelessWidget {
  const GlassSurface({
    super.key,
    required this.child,
    this.radius = 28,
    this.blur = 22,
    this.tint,
  });
  final Widget child;
  final double radius, blur;
  final Color? tint;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dark = theme.brightness == Brightness.dark;
    final surface =
        tint ?? theme.colorScheme.surface.withValues(alpha: dark ? .66 : .74);
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: BackdropFilter(
        filter: ui.ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: surface,
            borderRadius: BorderRadius.circular(radius),
            border: Border.all(
              color: theme.colorScheme.onSurface.withValues(
                alpha: dark ? .12 : .09,
              ),
            ),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color.alphaBlend(
                  Colors.white.withValues(alpha: dark ? .05 : .12),
                  surface,
                ),
                surface,
              ],
            ),
          ),
          child: child,
        ),
      ),
    );
  }
}
