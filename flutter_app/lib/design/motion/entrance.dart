import 'package:material_ui/material_ui.dart';

import '../tokens.dart';

/// One controller, transform-only entrance, no per-frame feature rebuilds.
class Entrance extends StatefulWidget {
  const Entrance({super.key, required this.child, this.index = 0});
  final Widget child;
  final int index;
  @override
  State<Entrance> createState() => _EntranceState();
}

class _EntranceState extends State<Entrance>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _progress;
  bool _started = false;

  @override
  void initState() {
    super.initState();
    final delay = MotionTokens.stagger(widget.index).inMilliseconds;
    final duration = delay + MotionTokens.entrance.inMilliseconds;
    _controller = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: duration),
    );
    _progress = _controller.drive(
      CurveTween(
        curve: Interval(delay / duration, 1, curve: MotionTokens.entranceCurve),
      ),
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.disableAnimationsOf(context)) {
      _controller.value = 1;
      _started = true;
    } else if (!_started) {
      _started = true;
      _controller.forward();
    }
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _progress,
    child: RepaintBoundary(child: widget.child),
    builder: (context, child) {
      final remaining = 1 - _progress.value;
      return IgnorePointer(
        ignoring: _progress.value < 0.5,
        child: Opacity(
          opacity: _progress.value,
          child: Transform.translate(
            offset: Offset(0, remaining * MotionTokens.entranceTravel),
            child: Transform.scale(
              scale: 1 - remaining * (1 - MotionTokens.entranceScale),
              child: child,
            ),
          ),
        ),
      );
    },
  );

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
