import 'package:flutter/rendering.dart';
import 'package:material_ui/material_ui.dart';

import '../tokens.dart';

/// Uses the card's actual sliver geometry. No guessed screen offsets or layout
/// during scrolling; the static child is retained while paint transforms change.
class ScrollDepth extends StatelessWidget {
  const ScrollDepth({super.key, required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) {
    final position = Scrollable.maybeOf(context)?.position;
    if (position == null || MediaQuery.disableAnimationsOf(context)) {
      return child;
    }
    return AnimatedBuilder(
      animation: position,
      child: RepaintBoundary(child: child),
      builder: (context, child) {
        final box = context.findRenderObject();
        var progress = 0.0;
        var height = 0.0;
        if (box is RenderBox && box.hasSize && box.attached) {
          final viewport = RenderAbstractViewport.maybeOf(box);
          if (viewport != null) {
            final top = viewport.getOffsetToReveal(box, 0).offset;
            height = box.size.height;
            final start = (top - 64).clamp(0.0, double.infinity);
            final span = top + height - start;
            final value = span <= 0
                ? 0.0
                : ((position.pixels - start) / span).clamp(0.0, 1.0);
            progress = (value * 200).roundToDouble() / 200;
          }
        }
        final fade = ((progress - .2) / .75).clamp(0.0, 1.0);
        return Opacity(
          opacity: 1 - fade * fade * (3 - 2 * fade),
          child: Transform.translate(
            offset: Offset(0, progress * height * .18),
            child: Transform.scale(
              alignment: const Alignment(0, -.3),
              scale: 1 - progress * .08,
              child: DecoratedBox(
                position: DecorationPosition.foreground,
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: progress * .45),
                  borderRadius: BorderRadius.circular(LayoutTokens.cardRadius),
                ),
                child: child,
              ),
            ),
          ),
        );
      },
    );
  }
}
