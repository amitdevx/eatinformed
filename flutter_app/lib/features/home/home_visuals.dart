import 'dart:math' as math;

import 'package:flutter/services.dart';
import 'package:material_ui/material_ui.dart';

import '../../design/tokens.dart';

class RatingRing extends StatelessWidget {
  const RatingRing(this.rating, {super.key});
  final double? rating;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final tone = rating == null
        ? colors.onSurfaceVariant
        : rating! >= 4
        ? colors.primary
        : rating! >= 2.5
        ? const Color(0xFFE0B15A)
        : colors.error;
    final value = (rating ?? 0).clamp(0.0, 5.0) / 5;
    return Semantics(
      label: rating == null
          ? 'AI rating estimate unavailable'
          : 'AI rating estimate ${rating!.toStringAsFixed(1)} of 5',
      child: SizedBox(
        width: 82,
        height: 82,
        child: TweenAnimationBuilder<double>(
          tween: Tween(begin: 0, end: value),
          duration: MediaQuery.disableAnimationsOf(context)
              ? Duration.zero
              : MotionTokens.entrance,
          curve: Curves.easeOutCubic,
          builder: (context, progress, _) => Stack(
            alignment: Alignment.center,
            children: [
              CustomPaint(
                size: const Size.square(82),
                painter: _RingPainter(
                  progress,
                  tone,
                  colors.onSurface.withValues(alpha: .08),
                ),
              ),
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      rating?.toStringAsFixed(1) ?? '—',
                      style: EatType.numeric(21, color: colors.onSurface),
                    ),
                    Text(
                      '/ 5',
                      style: EatType.label(10, color: colors.onSurfaceVariant),
                    ),
                    Text(
                      'SCORE',
                      style: EatType.label(
                        8,
                        color: tone,
                      ).copyWith(letterSpacing: .8),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  const _RingPainter(this.progress, this.color, this.track);
  final double progress;
  final Color color, track;
  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final center = rect.center;
    final radius = size.shortestSide / 2 - 4;
    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..color = track
        ..strokeWidth = 8
        ..style = PaintingStyle.stroke,
    );
    if (progress > 0) {
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        -math.pi / 2,
        2 * math.pi * progress,
        false,
        Paint()
          ..color = color
          ..strokeWidth = 8
          ..strokeCap = StrokeCap.round
          ..style = PaintingStyle.stroke,
      );
    }
  }

  @override
  bool shouldRepaint(_RingPainter old) =>
      old.progress != progress || old.color != color || old.track != track;
}

class RatingDay {
  const RatingDay(this.date, this.rating);
  final DateTime date;
  final double? rating;
}

class SevenDayTrend extends StatefulWidget {
  const SevenDayTrend({super.key, required this.days, required this.haptics});
  final List<RatingDay> days;
  final bool haptics;
  @override
  State<SevenDayTrend> createState() => _SevenDayTrendState();
}

class _SevenDayTrendState extends State<SevenDayTrend> {
  int? _selected;
  void _select(double x, double width) {
    final points = [
      for (var i = 0; i < widget.days.length; i++)
        if (widget.days[i].rating != null) i,
    ];
    if (points.isEmpty) return;
    final step = (width - 36) / (widget.days.length - 1);
    var nearest = points.first;
    for (final i in points.skip(1)) {
      if ((18 + i * step - x).abs() < (18 + nearest * step - x).abs()) {
        nearest = i;
      }
    }
    if (_selected == nearest) return;
    if (widget.haptics) HapticFeedback.selectionClick();
    setState(() => _selected = nearest);
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final available = [
      for (var i = 0; i < widget.days.length; i++)
        if (widget.days[i].rating != null) i,
    ];
    if (available.isEmpty) {
      return SizedBox(
        height: 160 * math.sqrt(MediaQuery.textScalerOf(context).scale(1)),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.show_chart, color: scheme.primary),
              Text(
                'No Scans in Last 7 Days',
                style: EatType.heading(16, color: scheme.onSurface),
              ),
            ],
          ),
        ),
      );
    }
    final selected =
        widget.days[_selected != null && widget.days[_selected!].rating != null
            ? _selected!
            : available.last];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          '${selected.date.month}/${selected.date.day}  ${selected.rating!.toStringAsFixed(1)} / 5',
          style: EatType.numeric(18, color: scheme.onSurface),
        ),
        const SizedBox(height: 6),
        LayoutBuilder(
          builder: (context, constraints) => GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTapDown: (event) =>
                _select(event.localPosition.dx, constraints.maxWidth),
            onHorizontalDragUpdate: (event) =>
                _select(event.localPosition.dx, constraints.maxWidth),
            child: Semantics(
              label: 'Seven day AI rating trend. Drag to inspect a day.',
              child: RepaintBoundary(
                child: SizedBox(
                  height: 160,
                  child: CustomPaint(
                    painter: _TrendPainter(
                      widget.days,
                      scheme.primary,
                      scheme.onSurface.withValues(alpha: .08),
                      _selected ?? available.last,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
        Row(
          children: [
            for (final day in widget.days)
              Expanded(
                child: Text(
                  const ['M', 'T', 'W', 'T', 'F', 'S', 'S'][day.date.weekday -
                      1],
                  textAlign: TextAlign.center,
                  style: EatType.label(10, color: scheme.onSurfaceVariant),
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class _TrendPainter extends CustomPainter {
  const _TrendPainter(this.days, this.accent, this.grid, this.selected);
  final List<RatingDay> days;
  final Color accent, grid;
  final int selected;

  @override
  void paint(Canvas canvas, Size size) {
    final plotHeight = size.height - 54;
    final step = (size.width - 36) / (days.length - 1);
    final points = <(int, Offset)>[
      for (var i = 0; i < days.length; i++)
        if (days[i].rating != null)
          (
            i,
            Offset(
              18 + i * step,
              24 + plotHeight * (1 - days[i].rating!.clamp(0, 5) / 5),
            ),
          ),
    ];
    final line = Paint()
      ..color = grid
      ..strokeWidth = 1;
    for (double x = 18; x < size.width - 18; x += 12) {
      canvas.drawLine(
        Offset(x, 24 + plotHeight * .2),
        Offset(math.min(x + 6, size.width - 18), 24 + plotHeight * .2),
        line,
      );
    }
    if (points.length > 1) {
      final path = Path()..moveTo(points.first.$2.dx, points.first.$2.dy);
      for (var i = 0; i < points.length - 1; i++) {
        final before = points[i == 0 ? 0 : i - 1].$2;
        final a = points[i].$2;
        final b = points[i + 1].$2;
        final after = points[i + 2 < points.length ? i + 2 : i + 1].$2;
        path.cubicTo(
          a.dx + (b.dx - before.dx) / 6,
          a.dy + (b.dy - before.dy) / 6,
          b.dx - (after.dx - a.dx) / 6,
          b.dy - (after.dy - a.dy) / 6,
          b.dx,
          b.dy,
        );
      }
      final fill = Path.from(path)
        ..lineTo(points.last.$2.dx, 24 + plotHeight)
        ..lineTo(points.first.$2.dx, 24 + plotHeight)
        ..close();
      canvas.drawPath(
        fill,
        Paint()
          ..shader = LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              accent.withValues(alpha: .30),
              accent.withValues(alpha: 0),
            ],
          ).createShader(Offset.zero & size),
      );
      canvas.drawPath(
        path,
        Paint()
          ..color = accent
          ..strokeWidth = 2.5
          ..style = PaintingStyle.stroke,
      );
    }
    for (final point in points) {
      canvas.drawCircle(
        point.$2,
        point.$1 == selected ? 6 : 3.5,
        Paint()..color = accent,
      );
      if (point.$1 == selected) {
        canvas.drawCircle(
          point.$2,
          8.5,
          Paint()
            ..color = accent.withValues(alpha: .2)
            ..style = PaintingStyle.stroke
            ..strokeWidth = 3,
        );
      }
    }
  }

  @override
  bool shouldRepaint(_TrendPainter old) =>
      old.days != days ||
      old.accent != accent ||
      old.grid != grid ||
      old.selected != selected;
}
