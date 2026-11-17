import 'dart:ui' as ui;

import 'package:material_ui/material_ui.dart';

/// A progressive backdrop treatment behind floating controls.
/// Separate clipped strips vary blur strength toward the screen edge, while
/// the navigation glass and icons are painted above this layer.
class EdgeBlur extends StatelessWidget {
  const EdgeBlur({
    super.key,
    required this.height,
    this.top = false,
    this.sigma = 16,
  });
  final double height;
  final bool top;
  final double sigma;

  @override
  Widget build(BuildContext context) {
    final background = Theme.of(context).scaffoldBackgroundColor;
    const strips = 6;
    final extent = height * .8 / strips;
    return IgnorePointer(
      child: SizedBox(
        height: height,
        child: Stack(
          children: [
            if (!MediaQuery.disableAnimationsOf(context))
              for (var i = 0; i < strips; i++)
                Positioned(
                  left: 0,
                  right: 0,
                  top: top ? extent * i : height - extent * (i + 1),
                  height: extent + .5,
                  child: ClipRect(
                    child: BackdropFilter(
                      filter: ui.ImageFilter.blur(
                        sigmaX: sigma * (1 - i / strips) * .7,
                        sigmaY: sigma * (1 - i / strips) * .7,
                        tileMode: ui.TileMode.clamp,
                      ),
                      child: const SizedBox.expand(),
                    ),
                  ),
                ),
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: top ? Alignment.topCenter : Alignment.bottomCenter,
                    end: top ? Alignment.bottomCenter : Alignment.topCenter,
                    colors: [
                      for (final alpha in const [.58, .42, .26, .12, .035, 0.0])
                        background.withValues(alpha: alpha),
                    ],
                    stops: const [0, .2, .42, .64, .84, 1],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
