import 'package:material_ui/material_ui.dart';

/// Only animates changes to an actual displayed value, without counting through
/// invented intermediate values. Accessibility reads the final value once.
class RollingValue extends StatelessWidget {
  const RollingValue(this.value, {super.key, this.style});
  final String value;
  final TextStyle? style;
  @override
  Widget build(BuildContext context) => Semantics(
    label: value,
    child: ExcludeSemantics(
      child: ClipRect(
        child: AnimatedSwitcher(
          duration: MediaQuery.disableAnimationsOf(context)
              ? Duration.zero
              : const Duration(milliseconds: 380),
          switchInCurve: Curves.easeOutCubic,
          switchOutCurve: Curves.easeInCubic,
          layoutBuilder: (current, previous) => Stack(
            alignment: Alignment.centerLeft,
            children: [...previous, ?current],
          ),
          transitionBuilder: (child, animation) => FadeTransition(
            opacity: animation,
            child: SlideTransition(
              position: Tween(
                begin: const Offset(0, .35),
                end: Offset.zero,
              ).animate(animation),
              child: child,
            ),
          ),
          child: Text(value, key: ValueKey(value), style: style),
        ),
      ),
    ),
  );
}
