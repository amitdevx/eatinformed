import 'package:material_ui/material_ui.dart';

import '../motion/entrance.dart';
import '../motion/scroll_depth.dart';
import '../tokens.dart';
import 'glass_surface.dart';

class SectionCard extends StatelessWidget {
  const SectionCard({
    super.key,
    required this.child,
    this.onTap,
    this.index = 0,
  });
  final Widget child;
  final VoidCallback? onTap;
  final int index;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: ScrollDepth(
      child: Entrance(
        index: index,
        child: Card(
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onTap,
            child: Padding(padding: const EdgeInsets.all(20), child: child),
          ),
        ),
      ),
    ),
  );
}

class PageHeading extends StatelessWidget {
  const PageHeading(this.title, {super.key, this.subtitle});
  final String title;
  final String? subtitle;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 12, bottom: 24),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.headlineLarge),
        if (subtitle != null) ...[
          const SizedBox(height: 8),
          Text(subtitle!, style: Theme.of(context).textTheme.bodyMedium),
        ],
      ],
    ),
  );
}

class Notice extends StatelessWidget {
  const Notice(this.text, {super.key, this.onRetry});
  final String text;
  final VoidCallback? onRetry;
  @override
  Widget build(BuildContext context) => Semantics(
    liveRegion: true,
    child: Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text(text),
            if (onRetry != null)
              TextButton(onPressed: onRetry, child: const Text('Try again')),
          ],
        ),
      ),
    ),
  );
}

Color novaColor(int? group) => switch (group) {
  1 => const Color(0xFF34D399),
  2 => const Color(0xFF60A5FA),
  3 => const Color(0xFFFBBF24),
  4 => const Color(0xFFF87171),
  _ => const Color(0xFF9CA3AF),
};

class NovaLabel extends StatelessWidget {
  const NovaLabel(this.group, {super.key});
  final int? group;
  @override
  Widget build(BuildContext context) => Chip(
    avatar: Icon(Icons.circle, size: 12, color: novaColor(group)),
    label: Text(group == null ? 'NOVA unavailable' : 'NOVA $group'),
  );
}

final ValueNotifier<int> _openGlassSheets = ValueNotifier<int>(0);

Future<T?> glassSheet<T>(BuildContext context, {required Widget child}) async {
  final level = ++_openGlassSheets.value;
  try {
    return await showModalBottomSheet<T>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: false,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: .42),
      elevation: 0,
      sheetAnimationStyle: const AnimationStyle(
        duration: MotionTokens.sheetEnter,
        reverseDuration: MotionTokens.sheetExit,
      ),
      builder: (context) => ValueListenableBuilder<int>(
        valueListenable: _openGlassSheets,
        builder: (context, open, _) => TweenAnimationBuilder<double>(
          tween: Tween(begin: 0, end: open > level ? 36 : 0),
          duration: MotionTokens.sheetEnter,
          curve: Curves.easeOutCubic,
          builder: (context, y, child) =>
              Transform.translate(offset: Offset(0, y), child: child),
          child: GlassSurface(
            radius: LayoutTokens.sheetRadius,
            child: Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.viewInsetsOf(context).bottom,
              ),
              child: DraggableScrollableSheet(
                expand: false,
                initialChildSize: .75,
                minChildSize: .3,
                maxChildSize: .95,
                builder: (context, scroll) => SingleChildScrollView(
                  controller: scroll,
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 36,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.onSurface
                              .withValues(alpha: .35),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(height: 20),
                      child,
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  } finally {
    _openGlassSheets.value = (_openGlassSheets.value - 1).clamp(0, 1000);
  }
}
