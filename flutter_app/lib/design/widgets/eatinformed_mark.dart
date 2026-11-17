import 'package:flutter/widgets.dart';

/// EatInformed's existing leaf and magnifier, rendered without a bitmap asset.
class EatInformedMark extends StatelessWidget {
  const EatInformedMark({
    super.key,
    required this.leaf,
    required this.ink,
    this.size = 36,
  });
  final Color leaf, ink;
  final double size;
  @override
  Widget build(BuildContext context) => ExcludeSemantics(
    child: SizedBox.square(
      dimension: size,
      child: CustomPaint(painter: _MarkPainter(leaf, ink)),
    ),
  );
}

class _MarkPainter extends CustomPainter {
  _MarkPainter(this.leaf, this.ink);
  final Color leaf, ink;
  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 64, size.height / 64);
    final shape = Path()
      ..moveTo(32, 5)
      ..cubicTo(18, 18, 16, 35, 32, 59)
      ..cubicTo(48, 35, 46, 18, 32, 5)
      ..close();
    canvas.drawPath(shape, Paint()..color = leaf);
    final stroke = Paint()
      ..color = ink
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.5
      ..strokeCap = StrokeCap.round;
    canvas.drawCircle(const Offset(26, 24), 11, stroke);
    canvas.drawLine(const Offset(35, 33), const Offset(45, 43), stroke);
    canvas.restore();
  }

  @override
  bool shouldRepaint(_MarkPainter oldDelegate) =>
      oldDelegate.leaf != leaf || oldDelegate.ink != ink;
}
