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
            progress = ((position.pixels - top + 64) / (box.size.height + 64))
                .clamp(0.0, 1.0);
          }
        }
        return Opacity(
          opacity:
              1 -
              Curves.easeInOut.transform(
                ((progress - .2) / .75).clamp(0.0, 1.0),
              ),
          child: Transform.translate(
            offset: Offset(0, progress * height * .18),
            child: Transform.scale(
              alignment: Alignment.topCenter,
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
