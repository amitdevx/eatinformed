import 'dart:ui' as ui;

import 'package:material_ui/material_ui.dart';
import 'package:flutter/services.dart';

import '../../core/data/account_state.dart';
import '../../core/data/models.dart';
import '../../core/data/preferences.dart';
import '../../core/data/sharing.dart';
import '../../core/session/session.dart';
import '../../design/motion/name_ticker.dart';
import '../../design/tokens.dart';
import '../../design/widgets/surfaces.dart';
import 'avatar.dart';
import 'pull_physics.dart';

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
    _pointer = e.pointer;
    _origin = e.localPosition;
    _measure();
    _armed = false;
  }

  void _move(PointerMoveEvent e) {
    if (e.pointer != _pointer || _origin == null || _opening) return;
    final delta = e.localPosition - _origin!;
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
    final p = PullPhysics.progress(delta.dy);
    _timeline.value = p;
    if (p >= 1 && !_armed) {
      _armed = true;
      _haptic();
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
    _opening = false;
    if (_reduced) {
      _timeline.value = 0;
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
              avatar: AnimatedBuilder(
                animation: progress,
                builder: (context, _) => Opacity(
                  opacity: _timeline.value == 0 ? 1 : 0,
                  child: AccountAvatar(
                    key: _source,
                    name: widget.session.name,
                    photo: widget.session.photoUrl,
                  ),
                ),
              ),
              name: widget.session.name,
              onSettings: widget.onSettings,
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
            sliver: SliverList.list(
              children: [
                TextButton(
                  onPressed: _open,
                  child: const Text('Pull down or tap for Food Passport'),
                ),
                Text(
                  widget.session.email.isEmpty
                      ? 'Anonymous account'
                      : widget.session.email,
                ),
                if (widget.session.handle != null)
                  Text('@${widget.session.handle}'),
                Wrap(
                  spacing: 8,
                  children: [
                    Chip(label: Text('${count ?? 'Unknown'} Scans')),
                    Chip(
                      label: Text(
                        classified == null
                            ? 'NOVA unavailable'
                            : '$clean / $classified NOVA 1-2',
                      ),
                    ),
                    Chip(label: Text('${year?.length ?? 'Unknown'} This year')),
                    Chip(
                      label: Text(
                        count == null
                            ? 'Level unavailable'
                            : count >= 20
                            ? 'Master'
                            : count >= 5
                            ? 'Scout'
                            : 'Novice',
                      ),
                    ),
                  ],
                ),
                OutlinedButton(
                  onPressed: widget.session.isGuest
                      ? widget.onUpgrade
                      : widget.onEdit,
                  child: Text(
                    widget.session.isGuest
                        ? 'Create an account to customize profile'
                        : 'Edit Profile',
                  ),
                ),
                if (widget.data.error != null)
                  Notice(widget.data.error!, onRetry: widget.data.load),
                SectionCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              'Achievements',
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                          ),
                          TextButton(
                            onPressed: _open,
                            child: const Text('Passport'),
                          ),
                        ],
                      ),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          for (final medal in [
                            ('First Audit', count != null && count >= 1),
                            (
                              'Clean Eater',
                              count != null &&
                                  count >= 5 &&
                                  classified != null &&
                                  classified > 0 &&
                                  clean! / classified >= .5,
                            ),
                            ('Label Scout', count != null && count >= 10),
                            ('Bio Shield', count != null && count >= 25),
                            (
                              'Daily Streak',
                              count != null &&
                                  records!.any(
                                    (e) => DateUtils.isSameDay(
                                      e.createdAt,
                                      DateTime.now(),
                                    ),
                                  ) &&
                                  records.any(
                                    (e) => DateUtils.isSameDay(
                                      e.createdAt,
                                      DateTime.now().subtract(
                                        const Duration(days: 1),
                                      ),
                                    ),
                                  ) &&
                                  records.any(
                                    (e) => DateUtils.isSameDay(
                                      e.createdAt,
                                      DateTime.now().subtract(
                                        const Duration(days: 2),
                                      ),
                                    ),
                                  ),
                            ),
                          ])
                            Chip(
                              avatar: Icon(
                                medal.$2 ? Icons.verified : Icons.lock_outline,
                                size: 18,
                              ),
                              label: Text(medal.$1),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                SectionCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              'Recent Snapshots',
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                          ),
                          TextButton(
                            onPressed: widget.onHistory,
                            child: const Text('History'),
                          ),
                        ],
                      ),
                      if (records == null)
                        const Text('History unavailable')
                      else if (records.isEmpty)
                        const Text('No scanned food snapshots yet')
                      else
                        for (final item in records.take(4))
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(item.result.name),
                            subtitle: Text(item.result.brand),
                            trailing: NovaLabel(item.result.nova),
                            onTap: () => widget.onOpen(item),
                          ),
                    ],
                  ),
                ),
                SectionCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Annual Density',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      Text('${year?.length ?? 'Unknown'} SCANS THIS YEAR'),
                      const SizedBox(height: 20),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          for (var m = 0; m < 12; m++)
                            Chip(
                              label: Text(
                                '${m + 1}: ${records == null ? 'Unknown' : months[m]}',
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      );
      final passport = Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 390),
            child: Card(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        const Expanded(child: Text('FOOD PASSPORT')),
                        IconButton(
                          onPressed: _close,
                          tooltip: 'Close Food Passport',
                          icon: const Icon(Icons.close),
                        ),
                      ],
                    ),
                    SizedBox(
                      key: _destination,
                      width: 100,
                      height: 100,
                      child: AnimatedBuilder(
                        animation: progress,
                        builder: (context, _) => Opacity(
                          opacity: _timeline.value >= 1.99 || _reduced ? 1 : 0,
                          child: AccountAvatar(
                            name: widget.session.name,
                            photo: widget.session.photoUrl,
                            size: 100,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      widget.session.name,
                      style: Theme.of(context).textTheme.headlineSmall,
                      textAlign: TextAlign.center,
                    ),
                    Text(
                      widget.session.email.isEmpty
                          ? 'Anonymous account'
                          : widget.session.email,
                      textAlign: TextAlign.center,
                    ),
                    if (widget.session.handle != null)
                      Text('@${widget.session.handle}'),
                    const SizedBox(height: 24),
                    Text(
                      '${count ?? 'Unknown'} ${widget.data.offline ? 'cached' : 'saved'} scans',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    Text(
                      classified == null
                          ? 'NOVA estimates unavailable'
                          : classified == 0
                          ? 'No NOVA estimates yet'
                          : '$clean of $classified classified scans estimated NOVA 1-2',
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Your label-reading activity. Food classifications are AI estimates, not health or identity certifications.',
                    ),
                    const SizedBox(height: 20),
                    FilledButton.icon(
                      onPressed: () => shareJson(context, {
                        'name': widget.session.name,
                        'handle': widget.session.handle,
                        'savedScans': count,
                      }),
                      icon: const Icon(Icons.ios_share),
                      label: const Text('Share Passport'),
                    ),
                  ],
                ),
              ),
            ),
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
                            _foreground && (_dragging || _timeline.value > 0),
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
                      final p = (_timeline.value / 2).clamp(0.0, 1.0);
                      final rect = Rect.lerp(
                        _from,
                        _to,
                        Curves.easeInOutSine.transform(p),
                      )!;
                      final arc =
                          (_timeline.value < 1 ? _pull : 2 - _timeline.value) *
                          MediaQuery.sizeOf(context).width *
                          .12;
                      return Positioned(
                        left: rect.left + arc,
                        top: rect.top,
                        width: rect.width,
                        height: rect.height,
                        child: IgnorePointer(
                          child: AnimatedScale(
                            scale: _armed ? 1.06 : 1,
                            duration: const Duration(milliseconds: 260),
                            curve: Curves.easeOutBack,
                            child: AccountAvatar(
                              name: widget.session.name,
                              photo: widget.session.photoUrl,
                              size: rect.width,
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
  _Header({required this.avatar, required this.name, required this.onSettings});
  final Widget avatar;
  final String name;
  final VoidCallback onSettings;
  @override
  double get minExtent => 104;
  @override
  double get maxExtent => 190;
  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    final p = (shrinkOffset / (maxExtent - minExtent)).clamp(0.0, 1.0);
    return SizedBox.expand(
      child: ColoredBox(
        color: Theme.of(context).scaffoldBackgroundColor,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Row(
            children: [
              SizedBox(
                width: 82,
                height: 82,
                child: Transform.scale(scale: 1 - p * .35, child: avatar),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  name,
                  style: Theme.of(context).textTheme.titleLarge,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              IconButton(
                onPressed: onSettings,
                tooltip: 'Settings',
                icon: const Icon(Icons.settings_outlined),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  bool shouldRebuild(_Header oldDelegate) => true;
}
