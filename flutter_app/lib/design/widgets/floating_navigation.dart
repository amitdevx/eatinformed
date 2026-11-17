import 'dart:ui' as ui;

import 'package:material_ui/material_ui.dart';
import 'package:flutter/services.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

/// A single selection surface shared by the four persistent destinations.
/// Scan remains a route, never a drag destination.
class FloatingNavigation extends StatefulWidget {
  const FloatingNavigation({
    super.key,
    required this.selected,
    required this.onSelect,
    required this.onScan,
  });
  final int selected;
  final ValueChanged<int> onSelect;
  final VoidCallback onScan;

  @override
  State<FloatingNavigation> createState() => _FloatingNavigationState();
}

class _FloatingNavigationState extends State<FloatingNavigation> {
  static const height = 68.0;
  static const scanWidth = 48.0;
  double? _dragX;
  int? _preview, _pressed;

  void _previewAt(double x, double iconWidth, double gap, double inner) {
    final center = 2 * iconWidth + 2 * gap + scanWidth / 2;
    if (_dragX == null && (x - center).abs() < scanWidth / 2 + 4) {
      return;
    }
    final centers = [
      iconWidth / 2,
      iconWidth * 1.5 + gap,
      inner - iconWidth * 1.5 - gap,
      inner - iconWidth / 2,
    ];
    var nearest = 0;
    for (var i = 1; i < centers.length; i++) {
      if ((x - centers[i]).abs() < (x - centers[nearest]).abs()) {
        nearest = i;
      }
    }
    if (nearest != _preview) HapticFeedback.selectionClick();
    setState(() {
      _dragX = x.clamp(iconWidth / 2, inner - iconWidth / 2);
      _preview = nearest;
    });
  }

  void _settle() {
    final target = _preview;
    setState(() {
      _dragX = null;
      _preview = null;
      _pressed = null;
    });
    if (target != null && target != widget.selected) widget.onSelect(target);
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final dark = Theme.of(context).brightness == Brightness.dark;
    final reduced = MediaQuery.disableAnimationsOf(context);
    return Center(
      heightFactor: 1,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 420),
        child: SizedBox(
          height: height,
          child: LayoutBuilder(
            builder: (context, constraints) {
              final inner = constraints.maxWidth - 28;
              final iconWidth = ((inner - scanWidth) / 4).clamp(44.0, 58.0);
              final gap = ((inner - 4 * iconWidth - scanWidth) / 4).clamp(
                0.0,
                40.0,
              );
              double left(int index) => switch (index) {
                0 => 0,
                1 => iconWidth + gap,
                2 => 2 * iconWidth + 3 * gap + scanWidth,
                _ => 3 * iconWidth + 4 * gap + scanWidth,
              };
              final pillWidth = iconWidth + gap * .4;
              return Stack(
                clipBehavior: Clip.none,
                children: [
                  Positioned.fill(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(34),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x55000000),
                            blurRadius: 28,
                            offset: Offset(0, 10),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(34),
                        child: BackdropFilter(
                          filter: ui.ImageFilter.blur(sigmaX: 30, sigmaY: 30),
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              color: scheme.surface.withValues(
                                alpha: dark ? .72 : .82,
                              ),
                              borderRadius: BorderRadius.circular(34),
                              border: Border.all(
                                color: scheme.onSurface.withValues(alpha: .12),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    left: 14,
                    right: 14,
                    top: 0,
                    bottom: 0,
                    child: IgnorePointer(
                      child: _LiquidSelection(
                        left: left(_preview ?? widget.selected) - gap * .2,
                        dragLeft: _dragX == null
                            ? null
                            : _dragX! - iconWidth / 2 - gap * .2,
                        width: pillWidth,
                        color: scheme.onSurface.withValues(
                          alpha: dark ? .13 : .08,
                        ),
                        reduced: reduced,
                      ),
                    ),
                  ),
                  Positioned(
                    left: 14,
                    right: 14,
                    top: 0,
                    bottom: 0,
                    child: GestureDetector(
                      behavior: HitTestBehavior.translucent,
                      onHorizontalDragStart: (details) {
                        _previewAt(
                          details.localPosition.dx,
                          iconWidth,
                          gap,
                          inner,
                        );
                      },
                      onHorizontalDragUpdate: (details) {
                        if (_dragX != null) {
                          _previewAt(
                            details.localPosition.dx,
                            iconWidth,
                            gap,
                            inner,
                          );
                        }
                      },
                      onHorizontalDragEnd: (_) {
                        if (_dragX != null) _settle();
                      },
                      onHorizontalDragCancel: () {
                        if (_dragX != null) _settle();
                      },
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _item(
                            0,
                            'Home',
                            PhosphorIconsRegular.house,
                            PhosphorIconsFill.house,
                            iconWidth,
                          ),
                          _item(
                            1,
                            'History',
                            PhosphorIconsRegular.clockCounterClockwise,
                            PhosphorIconsFill.clockCounterClockwise,
                            iconWidth,
                          ),
                          Semantics(
                            button: true,
                            label: 'Scan food label',
                            child: Tooltip(
                              message: 'Scan food label',
                              child: GestureDetector(
                                behavior: HitTestBehavior.opaque,
                                onTap: widget.onScan,
                                child: SizedBox(
                                  width: scanWidth,
                                  height: height,
                                  child: Center(
                                    child: DecoratedBox(
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        gradient: LinearGradient(
                                          colors: [
                                            scheme.primary,
                                            scheme.primary.withValues(
                                              alpha: .78,
                                            ),
                                          ],
                                        ),
                                        boxShadow: [
                                          BoxShadow(
                                            color: scheme.primary.withValues(
                                              alpha: .35,
                                            ),
                                            blurRadius: 18,
                                            offset: const Offset(0, 6),
                                          ),
                                        ],
                                      ),
                                      child: SizedBox(
                                        width: scanWidth,
                                        height: scanWidth,
                                        child: Icon(
                                          PhosphorIconsFill.scan,
                                          size: 22,
                                          color: scheme.onPrimary,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          _item(
                            2,
                            'Guide',
                            PhosphorIconsRegular.bookOpen,
                            PhosphorIconsFill.bookOpen,
                            iconWidth,
                          ),
                          _item(
                            3,
                            'Profile',
                            PhosphorIconsRegular.userCircle,
                            PhosphorIconsFill.userCircle,
                            iconWidth,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _item(
    int index,
    String label,
    IconData outline,
    IconData fill,
    double width,
  ) {
    final selected = (_preview ?? widget.selected) == index;
    final color = Theme.of(context).colorScheme.onSurface;
    return Semantics(
      button: true,
      selected: selected,
      label: label,
      child: Tooltip(
        message: label,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () {
            if (widget.selected != index) HapticFeedback.selectionClick();
            widget.onSelect(index);
          },
          onTapDown: (_) => setState(() => _pressed = index),
          onTapUp: (_) => setState(() => _pressed = null),
          onTapCancel: () => setState(() => _pressed = null),
          child: AnimatedScale(
            duration: Duration(milliseconds: _pressed == index ? 110 : 340),
            curve: _pressed == index ? Curves.easeOut : Curves.easeOutBack,
            scale: _pressed == index
                ? .85
                : selected && _dragX != null
                ? 1.08
                : 1,
            child: SizedBox(
              width: width,
              height: height,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  AnimatedOpacity(
                    duration: const Duration(milliseconds: 200),
                    opacity: selected ? 0 : .7,
                    child: Icon(outline, size: 24, color: color),
                  ),
                  AnimatedOpacity(
                    duration: const Duration(milliseconds: 200),
                    opacity: selected ? 1 : 0,
                    child: Icon(fill, size: 24, color: color),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _LiquidSelection extends StatefulWidget {
  const _LiquidSelection({
    required this.left,
    required this.width,
    required this.dragLeft,
    required this.color,
    required this.reduced,
  });
  final double left, width;
  final double? dragLeft;
  final Color color;
  final bool reduced;
  @override
  State<_LiquidSelection> createState() => _LiquidSelectionState();
}

class _LiquidSelectionState extends State<_LiquidSelection>
    with TickerProviderStateMixin {
  late final _movement = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 460),
    value: 1,
  );
  late final _lift = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 260),
    reverseDuration: const Duration(milliseconds: 380),
  );
  late double _from = widget.left;
  late double _shown = widget.left;

  @override
  void didUpdateWidget(_LiquidSelection old) {
    super.didUpdateWidget(old);
    if (widget.reduced) {
      _movement.value = 1;
      _lift.value = 0;
      return;
    }
    if ((widget.dragLeft != null) != (old.dragLeft != null)) {
      widget.dragLeft == null ? _lift.reverse() : _lift.forward();
    }
    if (widget.dragLeft != null) return;
    if (widget.left != old.left || old.dragLeft != null) {
      _from = _shown;
      _movement.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _movement.dispose();
    _lift.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: Listenable.merge([_movement, _lift]),
    builder: (context, _) {
      final lift = widget.reduced
          ? 0.0
          : const Cubic(.3, 1.25, .5, 1).transform(_lift.value);
      final drag = widget.dragLeft;
      final double leading, trailing;
      var squash = 1.0;
      if (drag != null) {
        leading = drag;
        trailing = drag + widget.width;
      } else {
        final t = widget.reduced ? 1.0 : _movement.value;
        final right = widget.left >= _from;
        final lead = const Cubic(.2, 1.35, .35, 1).transform(t);
        final trail = const Cubic(.45, 0, .2, 1).transform(t);
        leading = _from + (widget.left - _from) * (right ? trail : lead);
        trailing =
            _from +
            widget.width +
            (widget.left - _from) * (right ? lead : trail);
        squash =
            1 - .14 * (1 - (2 * t - 1).abs()) * (widget.left == _from ? 0 : 1);
      }
      _shown = leading;
      final grow = 6 * lift;
      final inset = 10 + 8 * (1 - squash) - 5 * lift;
      return Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            left: leading - grow,
            width: (trailing - leading + 2 * grow).clamp(1.0, double.infinity),
            top: inset,
            bottom: inset,
            child: DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(100),
                color: widget.color.withValues(
                  alpha: (widget.color.a * (1 + 1.4 * lift)).clamp(0.0, 1.0),
                ),
                border: Border.all(
                  color: Colors.white.withValues(alpha: .16 * lift),
                ),
                boxShadow: lift > 0
                    ? [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: .28 * lift),
                          blurRadius: 22,
                          offset: const Offset(0, 8),
                        ),
                      ]
                    : null,
              ),
            ),
          ),
        ],
      );
    },
  );
}
