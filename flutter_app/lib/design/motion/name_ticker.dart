import 'package:flutter/scheduler.dart';
import 'package:flutter/widgets.dart';

import '../tokens.dart';

/// Decorative typography; hidden from accessibility and never owns touches.
/// Paint is driven directly, without rebuilding the profile each frame.
class NameTicker extends StatefulWidget {
  const NameTicker({
    super.key,
    required this.text,
    required this.color,
    required this.running,
    this.speed = 38,
    this.fontSize = 118,
    this.rows = 5,
  });
  final String text;
  final Color color;
  final bool running;
  final double speed, fontSize;
  final int rows;
  @override
  State<NameTicker> createState() => _NameTickerState();
}

class _NameTickerState extends State<NameTicker>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  final _clock = ValueNotifier<double>(0);
  late final Ticker _ticker;
  TextPainter? _text;
  Duration _previousFrame = Duration.zero;
  bool _foreground = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    final lifecycle = WidgetsBinding.instance.lifecycleState;
    _foreground = lifecycle == null || lifecycle == AppLifecycleState.resumed;
    _ticker = createTicker((elapsed) {
      final delta = elapsed - _previousFrame;
      _previousFrame = elapsed;
      _clock.value += delta.inMicroseconds / 1000000;
    });
  }

  void _measure() {
    _text?.dispose();
    _text = TextPainter(
      text: TextSpan(
        text:
            '${widget.text.trim().isEmpty ? 'EATINFORMED' : widget.text.trim().toUpperCase()}  ·  ',
        style: TextStyle(
          fontFamily: EatType.family,
          fontSize: widget.fontSize,
          fontWeight: FontWeight.w900,
          color: widget.color,
          height: 1,
          letterSpacing: -widget.fontSize * .04,
        ),
      ),
      textDirection: TextDirection.ltr,
      maxLines: 1,
    )..layout();
  }

  void _sync() {
    final run =
        widget.running &&
        _foreground &&
        TickerMode.valuesOf(context).enabled &&
        !MediaQuery.disableAnimationsOf(context) &&
        widget.speed > 0;
    if (run && !_ticker.isActive) {
      _previousFrame = Duration.zero;
      _ticker.start();
    } else if (!run && _ticker.isActive) {
      _ticker.stop();
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _measure();
    _sync();
  }

  @override
  void didUpdateWidget(NameTicker oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.text != widget.text ||
        oldWidget.fontSize != widget.fontSize ||
        oldWidget.color != widget.color) {
      _measure();
    }
    _sync();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    _foreground = state == AppLifecycleState.resumed;
    _sync();
  }

  @override
  Widget build(BuildContext context) => ExcludeSemantics(
    child: IgnorePointer(
      child: RepaintBoundary(
        child: ClipRect(
          child: CustomPaint(
            painter: _RowsPainter(_text!, _clock, widget.speed, widget.rows),
            child: const SizedBox.expand(),
          ),
        ),
      ),
    ),
  );

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _ticker.dispose();
    _clock.dispose();
    _text?.dispose();
    super.dispose();
  }
}

class _RowsPainter extends CustomPainter {
  _RowsPainter(this.text, this.clock, this.speed, this.rows)
    : super(repaint: clock);
  final TextPainter text;
  final ValueNotifier<double> clock;
  final double speed;
  final int rows;
  @override
  void paint(Canvas canvas, Size size) {
    final span = text.width, line = text.height * .86;
    if (span <= 0 || line <= 0) return;
    final shown = rows <= 0 ? (size.height / line).ceil() + 1 : rows;
    final top = (size.height - line * shown) / 2;
    for (var row = 0; row < shown; row++) {
      final travel = (clock.value * speed * (1 + .18 * (row % 3))) % span;
      final shift = row.isEven ? -travel : travel - span;
      for (double x = shift; x < size.width; x += span) {
        text.paint(canvas, Offset(x, top + row * line - text.height * .07));
      }
    }
  }

  @override
  bool shouldRepaint(_RowsPainter oldDelegate) =>
      oldDelegate.text != text ||
      oldDelegate.clock != clock ||
      oldDelegate.speed != speed ||
      oldDelegate.rows != rows;
}
