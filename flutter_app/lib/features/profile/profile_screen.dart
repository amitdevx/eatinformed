import 'dart:ui' as ui;
import 'dart:math' as math;

import 'package:material_ui/material_ui.dart';
import 'package:flutter/services.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../../core/data/account_state.dart';
import '../../core/data/models.dart';
import '../../core/data/preferences.dart';
import '../../core/data/sharing.dart';
import '../../core/session/session.dart';
import '../../design/motion/name_ticker.dart';
import '../../design/tokens.dart';
import '../../design/widgets/surfaces.dart';
import '../../design/widgets/edge_blur.dart';
import 'avatar.dart';
import 'pull_physics.dart';
import 'profile_insights.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({
    super.key,
    required this.session,
    required this.data,
    required this.preferences,
    required this.onEdit,
    required this.onSettings,
    required this.onHistory,
    required this.onOpen,
    required this.onUpgrade,
    required this.onReveal,
  });
  final AccountSession session;
  final AccountState data;
  final AppPreferences preferences;
  final VoidCallback onEdit, onSettings, onHistory, onUpgrade;
  final ValueChanged<ScanRecord> onOpen;
  final ValueChanged<bool> onReveal;
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  late final AnimationController _timeline;
  final _scroll = ScrollController();
  final _scene = GlobalKey(), _source = GlobalKey(), _destination = GlobalKey();
  Offset? _origin;
  int? _pointer;
  bool _dragging = false, _armed = false, _opening = false, _foreground = true;
  double _pullDistance = 0;
  Rect? _from, _to;
  @override
  void initState() {
    super.initState();
    _timeline = AnimationController(vsync: this, upperBound: 2);
    WidgetsBinding.instance.addObserver(this);
  }

  bool get _reduced => MediaQuery.disableAnimationsOf(context);
  double get _pull => _timeline.value.clamp(0, 1);
  double get _overlay => (_timeline.value - 1).clamp(0, 1);
  void _measure() {
    final root = _scene.currentContext?.findRenderObject();
    if (root is! RenderBox) return;
    Rect? rect(GlobalKey key) {
      final box = key.currentContext?.findRenderObject();
      return box is RenderBox && box.hasSize
          ? (box.localToGlobal(Offset.zero, ancestor: root) & box.size)
          : null;
    }

    _from = rect(_source);
    _to = rect(_destination);
  }

  void _haptic() {
    if (widget.preferences.haptics) HapticFeedback.heavyImpact();
  }

  void _down(PointerDownEvent e) {
    if (_pointer != null && e.pointer != _pointer) {
      _close();
      return;
    }
    if (_opening || _timeline.value > 1) return;
    final edges = MediaQuery.systemGestureInsetsOf(context),
        width = context.size?.width ?? MediaQuery.sizeOf(context).width;
    if (!_scroll.hasClients ||
        _scroll.offset > 0.5 ||
        e.localPosition.dx < edges.left ||
        e.localPosition.dx > width - edges.right) {
      return;
    }
    _timeline.stop();
    _pullDistance = _timeline.value.clamp(0, 1) * PullPhysics.reach;
    _pointer = e.pointer;
    _origin = e.localPosition;
    _measure();
    _armed = false;
  }

  void _move(PointerMoveEvent e) {
    if (e.pointer != _pointer || _origin == null || _opening) return;
    final delta = e.localPosition - _origin!;
    final wasDragging = _dragging;
    if (!_dragging) {
      if (delta.dx.abs() > 14 && delta.dx.abs() > delta.dy.abs()) {
        _pointer = null;
        return;
      }
      if (delta.dy < 0) {
        _pointer = null;
        return;
      }
      if (delta.dy < 14 || delta.dy < delta.dx.abs() * 1.5) return;
      setState(() => _dragging = true);
      widget.onReveal(true);
    }
    _pullDistance = PullPhysics.advance(
      _pullDistance,
      wasDragging ? e.delta.dy : delta.dy,
    );
    _timeline.value = PullPhysics.progress(_pullDistance);
    if (_pullDistance >= PullPhysics.reach && !_armed) {
      _armed = true;
      _haptic();
    } else if (_pullDistance < PullPhysics.reach) {
      _armed = false;
    }
  }

  void _release(PointerUpEvent e) {
    if (e.pointer != _pointer) return;
    _pointer = null;
    _origin = null;
    if (!_dragging) return;
    if (_timeline.value >= 1) {
      _open();
    } else {
      _close();
    }
  }

  void _cancel(PointerCancelEvent e) {
    if (e.pointer == _pointer) {
      _pointer = null;
      _origin = null;
      _close();
    }
  }

  Future<void> _open() async {
    if (_opening || _timeline.value >= 2) return;
    _measure();
    _opening = true;
    widget.onReveal(true);
    setState(() => _dragging = false);
    if (widget.preferences.haptics) HapticFeedback.mediumImpact();
    if (_reduced) {
      _timeline.value = 2;
    } else {
      try {
        await _timeline
            .animateTo(
              2,
              duration: MotionTokens.sheetEnter,
              curve: Curves.easeOutCubic,
            )
            .orCancel;
      } on TickerCanceled {
        return;
      }
    }
    if (mounted) setState(() => _opening = false);
  }

  Future<void> _close() async {
    if (!mounted) return;
    _pointer = null;
    _origin = null;
    _armed = false;
    _pullDistance = 0;
    _opening = false;
    if (_reduced) {
      _timeline.value = 0;
      _pullDistance = 0;
    } else {
      try {
        await _timeline
            .animateBack(
              0,
              duration: MotionTokens.settle,
              curve: Curves.easeOutCubic,
            )
            .orCancel;
      } on TickerCanceled {
        return;
      }
    }
    if (mounted) {
      setState(() => _dragging = false);
      widget.onReveal(false);
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    _foreground = state == AppLifecycleState.resumed;
    if (!_foreground) {
      _pointer = null;
      _origin = null;
      _timeline.stop();
      _timeline.value = 0;
      _opening = false;
      _dragging = false;
      widget.onReveal(false);
    }
    if (mounted) setState(() {});
  }

  @override
  void deactivate() {
    _timeline.stop();
    super.deactivate();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timeline.dispose();
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: widget.data,
    builder: (context, _) {
      final records = widget.data.records;
      final count = records?.length,
          clean = records
              ?.where((e) => e.result.nova != null && e.result.nova! <= 2)
              .length;
      final classified = records?.where((e) => e.result.nova != null).length;
      final year = records
          ?.where((e) => e.createdAt.year == DateTime.now().year)
          .toList();
      final months = List<int>.generate(
        12,
        (m) => year?.where((e) => e.createdAt.month == m + 1).length ?? 0,
      );
      final cleanPercent = classified == null || classified == 0
          ? null
          : ((clean! / classified) * 100).round();
      final progress = _timeline;
      final profile = CustomScrollView(
        controller: _scroll,
        physics: _dragging
            ? const NeverScrollableScrollPhysics()
            : const ClampingScrollPhysics(),
        slivers: [
          SliverPersistentHeader(
            pinned: true,
            delegate: _Header(
              avatar: AccountAvatar(
                key: _source,
                name: widget.session.name,
                photo: widget.session.photoUrl,
                size: 86,
              ),
              name: widget.session.name,
              identity: widget.session.handle == null
                  ? widget.session.email.isEmpty
                        ? 'Anonymous account'
                        : widget.session.email
                  : '@${widget.session.handle}',
              isGuest: widget.session.isGuest,
              pull: progress,
              textScale: MediaQuery.textScalerOf(context).scale(1),
              onSettings: widget.onSettings,
              onEdit: widget.session.isGuest ? widget.onUpgrade : widget.onEdit,
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 126),
            sliver: SliverList.list(
              children: [
                ProfileStatStrip(
                  scans: count,
                  cleanPercent: cleanPercent,
                  yearScans: year?.length,
                ),
                const SizedBox(height: 16),
                if (widget.data.error != null)
                  Notice(widget.data.error!, onRetry: widget.data.load),
                AchievementShelf(records: records, onPassport: _open),
                RecentSnapshotFan(
                  records: records,
                  onHistory: widget.onHistory,
                ),
                AnnualDensity(
                  months: records == null ? null : months,
                  yearScans: year?.length,
                  cleanPercent: cleanPercent,
                  haptics: widget.preferences.haptics,
                ),
              ],
            ),
          ),
        ],
      );
      final scheme = Theme.of(context).colorScheme;
      final passport = SafeArea(
        child: LayoutBuilder(
          builder: (context, limits) => Stack(
            children: [
              Positioned.fill(
                child: NameTicker(
                  text: widget.session.name,
                  color: scheme.onSurface.withValues(alpha: .06),
                  running: _foreground && _overlay > 0,
                  rows: 0,
                ),
              ),
              Positioned.fill(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: math.max(0, limits.maxHeight - 36),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                'FOOD PASSPORT',
                                style:
                                    EatType.label(
                                      11,
                                      color: scheme.onSurface,
                                    ).copyWith(
                                      letterSpacing: 1.6,
                                      fontWeight: FontWeight.w800,
                                    ),
                              ),
                            ),
                            IconButton(
                              onPressed: _close,
                              tooltip: 'Close Food Passport',
                              icon: const Icon(
                                PhosphorIconsRegular.x,
                                size: 22,
                              ),
                            ),
                          ],
                        ),
                        Column(
                          children: [
                            SizedBox(
                              key: _destination,
                              width: 150,
                              height: 150,
                              child: AnimatedBuilder(
                                animation: progress,
                                builder: (context, _) => Opacity(
                                  opacity: _timeline.value >= 1.99 || _reduced
                                      ? 1
                                      : 0,
                                  child: AccountAvatar(
                                    name: widget.session.name,
                                    photo: widget.session.photoUrl,
                                    size: 150,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 22),
                            Text(
                              widget.session.name,
                              style: EatType.display(
                                34,
                                color: scheme.onSurface,
                              ),
                              textAlign: TextAlign.center,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 6),
                            Text(
                              widget.session.email.isEmpty
                                  ? 'Anonymous account'
                                  : widget.session.email,
                              textAlign: TextAlign.center,
                              style: EatType.body(
                                14,
                                color: scheme.onSurfaceVariant,
                              ),
                            ),
                            if (widget.session.handle != null)
                              Text(
                                '@${widget.session.handle}',
                                style: EatType.label(14, color: scheme.primary),
                              ),
                            const SizedBox(height: 26),
                            Text(
                              '${count ?? 'Unknown'} ${widget.data.offline ? 'cached' : 'saved'} scans',
                              style: EatType.numeric(
                                36,
                                color: scheme.onSurface,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              classified == null
                                  ? 'NOVA estimates unavailable'
                                  : classified == 0
                                  ? 'No NOVA estimates yet'
                                  : '$clean of $classified classified scans estimated NOVA 1-2',
                              style: EatType.body(
                                14,
                                color: scheme.onSurfaceVariant,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                        Column(
                          children: [
                            Text(
                              'Your label-reading activity. Food classifications are AI estimates, not health or identity certifications.',
                              style: EatType.body(
                                12,
                                color: scheme.onSurfaceVariant,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 12),
                            FilledButton.icon(
                              onPressed: () => shareJson(context, {
                                'name': widget.session.name,
                                'handle': widget.session.handle,
                                'savedScans': count,
                              }),
                              icon: const Icon(
                                PhosphorIconsRegular.shareNetwork,
                                size: 18,
                              ),
                              label: const Text('Share Passport'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
      return AnimatedBuilder(
        animation: progress,
        builder: (context, _) => PopScope(
          canPop: _timeline.value == 0,
          onPopInvokedWithResult: (didPop, result) {
            if (!didPop) _close();
          },
          child: Listener(
            onPointerDown: _down,
            onPointerMove: _move,
            onPointerUp: _release,
            onPointerCancel: _cancel,
            child: Stack(
              key: _scene,
              children: [
                Positioned.fill(
                  child: Opacity(
                    opacity: _pull,
                    child: Transform.scale(
                      scale: _reduced
                          ? 1
                          : 1.3 - .3 * Curves.easeOutCubic.transform(_pull),
                      child: NameTicker(
                        text: widget.session.name,
                        color: Theme.of(context).colorScheme.onSurface
                            .withValues(alpha: .14),
                        running:
                            _foreground &&
                            (_dragging ||
                                (_timeline.value > 0 && _overlay == 0)),
                      ),
                    ),
                  ),
                ),
                Positioned.fill(
                  child: ExcludeSemantics(
                    excluding: _overlay > 0,
                    child: IgnorePointer(
                      ignoring: _overlay > 0,
                      child: Opacity(
                        opacity: 1 - _pull * .95,
                        child: Transform.translate(
                          offset: Offset(0, _reduced ? 0 : _pull * 115.5),
                          child: profile,
                        ),
                      ),
                    ),
                  ),
                ),
                Positioned.fill(
                  child: ExcludeSemantics(
                    excluding: _overlay == 0,
                    child: IgnorePointer(
                      ignoring: _overlay == 0,
                      child: Opacity(
                        opacity: _overlay,
                        child: Stack(
                          children: [
                            Positioned.fill(
                              child: ClipRect(
                                child: BackdropFilter(
                                  filter: ui.ImageFilter.blur(
                                    sigmaX: 14 * _overlay,
                                    sigmaY: 14 * _overlay,
                                  ),
                                  child: GestureDetector(
                                    onTap: _close,
                                    child: ColoredBox(
                                      color: Colors.black.withValues(
                                        alpha: .3 * _overlay,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            Semantics(
                              scopesRoute: true,
                              explicitChildNodes: true,
                              namesRoute: true,
                              label: 'Food Passport',
                              child: Transform.translate(
                                offset: Offset(
                                  0,
                                  _reduced ? 0 : (1 - _overlay) * 24,
                                ),
                                child: Transform.scale(
                                  scale: _reduced ? 1 : .92 + .08 * _overlay,
                                  child: passport,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),

                if (!_reduced &&
                    _timeline.value > 0 &&
                    _timeline.value < 1.99 &&
                    _from != null &&
                    _to != null)
                  Builder(
                    builder: (context) {
                      final p = _timeline.value.clamp(0.0, 1.0);
                      final size = 86 + 64 * Curves.easeInOutSine.transform(p);
                      final target = _to!.center;
                      final radius = math.max(
                        0.0,
                        math.min(
                          MediaQuery.sizeOf(context).width / 2 - 89,
                          120,
                        ),
                      );
                      const startAngle = math.pi * .82;
                      final entry =
                          target +
                          Offset(
                            math.cos(startAngle) * radius,
                            math.sin(startAngle) * radius,
                          );
                      final source =
                          _from!.center + Offset(0, _pullDistance * .55);
                      Offset center;
                      if (p < .3) {
                        center = Offset.lerp(
                          source,
                          entry,
                          Curves.easeIn.transform(p / .3),
                        )!;
                      } else {
                        final phase = (p - .3) / .7;
                        final angle =
                            startAngle -
                            1.05 *
                                math.pi *
                                Curves.easeInOutSine.transform(phase);
                        final shrink = Curves.easeInCubic.transform(
                          ((phase - .35) / .65).clamp(0.0, 1.0),
                        );
                        center =
                            target +
                            Offset(
                              math.cos(angle) * radius * (1 - shrink),
                              math.sin(angle) * radius * (1 - shrink),
                            );
                      }
                      return Positioned(
                        left: center.dx - size / 2,
                        top: center.dy - size / 2,
                        width: size,
                        height: size,
                        child: IgnorePointer(
                          child: AnimatedScale(
                            scale: _armed ? 1.06 : 1,
                            duration: const Duration(milliseconds: 260),
                            curve: Curves.easeOutBack,
                            child: AccountAvatar(
                              name: widget.session.name,
                              photo: widget.session.photoUrl,
                              size: size,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
              ],
            ),
          ),
        ),
      );
    },
  );
}

class _Header extends SliverPersistentHeaderDelegate {
  _Header({
    required this.avatar,
    required this.name,
    required this.identity,
    required this.isGuest,
    required this.pull,
    required this.textScale,
    required this.onSettings,
    required this.onEdit,
  });
  final Widget avatar;
  final String name, identity;
  final bool isGuest;
  final Animation<double> pull;
  final double textScale;
  final VoidCallback onSettings, onEdit;
  @override
  double get minExtent => 60 + math.max(0, textScale - 1) * 30;
  @override
  double get maxExtent => 254 + math.max(0, textScale - 1) * 64;
  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final shrunk = (shrinkOffset / (maxExtent - minExtent)).clamp(0.0, 1.0);
    final bannerBottom = math.max(minExtent, 172 - shrinkOffset);
    final avatarTop = bannerBottom - 86 + 18;
    final expanded = (1 - shrunk * 2).clamp(0.0, 1.0);
    final compact = ((shrunk - .7) / .3).clamp(0.0, 1.0);
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Positioned(
          left: 0,
          right: 0,
          top: 0,
          height: bannerBottom,
          child: AnimatedBuilder(
            animation: pull,
            builder: (context, _) {
              final p = pull.value.clamp(0.0, 1.0);
              Widget banner = DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      scheme.primary.withValues(alpha: .28),
                      scheme.surface,
                      theme.scaffoldBackgroundColor,
                    ],
                    stops: const [0, .58, 1],
                  ),
                ),
                child: const SizedBox.expand(),
              );
              if (p > 0 && !MediaQuery.disableAnimationsOf(context)) {
                banner = ImageFiltered(
                  imageFilter: ui.ImageFilter.blur(
                    sigmaX: 14 * p,
                    sigmaY: 14 * p,
                  ),
                  child: Transform.scale(
                    alignment: Alignment.topCenter,
                    scale: 1 + .35 * p,
                    child: banner,
                  ),
                );
              }
              return Opacity(
                opacity: ((1 - shrunk) * (1 - p)).clamp(0.0, 1.0),
                child: ClipRect(child: banner),
              );
            },
          ),
        ),
        if (compact > 0)
          Positioned(
            left: 0,
            right: 0,
            top: 0,
            child: Opacity(
              opacity: compact,
              child: EdgeBlur(height: minExtent, top: true, sigma: 14),
            ),
          ),
        Positioned(
          right: 16,
          top: 6,
          child: IconButton(
            onPressed: onSettings,
            tooltip: 'Settings',
            style: IconButton.styleFrom(
              backgroundColor: Colors.black.withValues(alpha: .38),
              foregroundColor: Colors.white,
            ),
            icon: const Icon(PhosphorIconsRegular.gearSix, size: 18),
          ),
        ),
        Positioned(
          left: 0,
          right: 0,
          top: bannerBottom - 9,
          child: IgnorePointer(
            child: Opacity(
              opacity: expanded,
              child: Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: scheme.onSurface.withValues(alpha: .36),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
            ),
          ),
        ),
        Positioned(
          left: 20,
          top: avatarTop,
          child: AnimatedBuilder(
            animation: pull,
            child: avatar,
            builder: (context, child) =>
                Opacity(opacity: pull.value > 0 ? 0 : expanded, child: child),
          ),
        ),
        Positioned(
          right: 20,
          top: avatarTop + 86 - 40,
          child: IgnorePointer(
            ignoring: expanded < .5,
            child: Opacity(
              opacity: expanded,
              child: Semantics(
                button: true,
                label: isGuest ? 'Create account' : 'Edit Profile',
                child: Tooltip(
                  message: isGuest ? 'Create account' : 'Edit Profile',
                  child: InkWell(
                    borderRadius: BorderRadius.circular(18),
                    onTap: onEdit,
                    child: SizedBox(
                      height: 40,
                      child: Center(
                        child: Container(
                          height: 28,
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: scheme.surface.withValues(alpha: .8),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: scheme.onSurface.withValues(alpha: .12),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                PhosphorIconsRegular.pencilSimple,
                                size: 13,
                                color: scheme.onSurfaceVariant,
                              ),
                              const SizedBox(width: 5),
                              Text(
                                isGuest ? 'Sign up' : 'Edit',
                                style: EatType.label(
                                  12,
                                  color: scheme.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
        Positioned(
          left: 20,
          right: 20,
          top: avatarTop + 86 + 14,
          child: IgnorePointer(
            child: Opacity(
              opacity: expanded,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: EatType.heading(
                      24,
                      color: scheme.onSurface,
                    ).copyWith(fontWeight: FontWeight.w800, letterSpacing: -.3),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    identity,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: EatType.body(13, color: scheme.onSurfaceVariant),
                  ),
                ],
              ),
            ),
          ),
        ),
        if (compact > 0)
          Positioned(
            left: 72,
            right: 72,
            top: 9,
            child: IgnorePointer(
              child: Opacity(
                opacity: compact,
                child: Transform.translate(
                  offset: Offset(0, 8 * (1 - compact)),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      AccountAvatar(name: name, size: 24),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: EatType.heading(
                            15.5,
                            color: scheme.onSurface,
                          ).copyWith(fontWeight: FontWeight.w800),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }

  @override
  bool shouldRebuild(_Header oldDelegate) => true;
}
