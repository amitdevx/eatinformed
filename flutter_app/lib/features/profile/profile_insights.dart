import 'dart:math' as math;

import 'package:flutter/services.dart';
import 'package:material_ui/material_ui.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../../core/data/models.dart';
import '../../design/tokens.dart';
import '../../design/widgets/surfaces.dart';

class ProfileStatStrip extends StatelessWidget {
  const ProfileStatStrip({
    super.key,
    this.scans,
    this.cleanPercent,
    this.yearScans,
  });
  final int? scans, cleanPercent, yearScans;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final level = scans == null
        ? 'Unknown'
        : scans! >= 20
        ? 'Master'
        : scans! >= 5
        ? 'Scout'
        : 'Novice';
    final stats = [
      (
        PhosphorIconsRegular.scan,
        scans?.toString() ?? '—',
        'Scans',
        scheme.primary,
      ),
      (
        PhosphorIconsRegular.leaf,
        cleanPercent == null ? '—' : '$cleanPercent%',
        'Clean',
        const Color(0xFF10B981),
      ),
      (
        PhosphorIconsRegular.flame,
        yearScans?.toString() ?? '—',
        'This year',
        const Color(0xFFEF4444),
      ),
      (PhosphorIconsRegular.medal, level, '', const Color(0xFFF59E0B)),
    ];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final stat in stats)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: scheme.surfaceContainer,
                  border: Border.all(color: scheme.outlineVariant),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 9,
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(stat.$1, color: stat.$4, size: 15),
                      const SizedBox(width: 5),
                      Text(
                        stat.$2,
                        style: EatType.numeric(14, color: scheme.onSurface),
                      ),
                      if (stat.$3.isNotEmpty) ...[
                        const SizedBox(width: 4),
                        Text(
                          stat.$3,
                          style: EatType.label(
                            11,
                            color: scheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class AchievementShelf extends StatelessWidget {
  const AchievementShelf({
    super.key,
    required this.records,
    required this.onPassport,
  });
  final List<ScanRecord>? records;
  final VoidCallback onPassport;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final count = records?.length;
    final classified = records?.where((r) => r.result.nova != null).length;
    final clean = records
        ?.where((r) => r.result.nova != null && r.result.nova! <= 2)
        .length;
    final cleanRatio = classified == null || classified == 0
        ? null
        : clean! / classified;
    final awards = [
      (
        'First Audit',
        '1st scan logged',
        PhosphorIconsRegular.scan,
        const Color(0xFF10B981),
        count != null && count >= 1,
      ),
      (
        'Clean Eater',
        '5+ clean items',
        PhosphorIconsRegular.leaf,
        const Color(0xFF10B981),
        count != null && count >= 5 && cleanRatio != null && cleanRatio >= .5,
      ),
      (
        'Label Scout',
        '10+ products',
        PhosphorIconsRegular.medal,
        const Color(0xFF3B82F6),
        count != null && count >= 10,
      ),
      (
        'Bio Shield',
        '25+ products',
        PhosphorIconsRegular.shield,
        const Color(0xFF8B5CF6),
        count != null && count >= 25,
      ),
      (
        'Daily Streak',
        'Active routine',
        PhosphorIconsRegular.flame,
        const Color(0xFFEF4444),
        records != null &&
            [0, 1, 2].every(
              (ago) => records!.any(
                (r) => DateUtils.isSameDay(
                  r.createdAt,
                  DateTime.now().subtract(Duration(days: ago)),
                ),
              ),
            ),
      ),
    ];
    return SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            height: 104 * math.sqrt(MediaQuery.textScalerOf(context).scale(1)),
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: awards.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final award = awards[index];
                return SizedBox(
                  width: 94,
                  child: Column(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: award.$5
                              ? award.$4.withValues(alpha: .14)
                              : scheme.surfaceContainerHighest,
                          border: Border.all(
                            color: award.$5 ? award.$4 : scheme.outlineVariant,
                          ),
                        ),
                        child: Icon(
                          award.$3,
                          size: 21,
                          color: award.$5
                              ? award.$4
                              : scheme.onSurfaceVariant.withValues(alpha: .5),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        award.$1,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: EatType.label(11, color: scheme.onSurface),
                      ),
                      Text(
                        award.$2,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: EatType.label(9, color: scheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          Wrap(
            spacing: 8,
            runSpacing: 4,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Text(
                'Achievements',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              Text(
                '${awards.where((a) => a.$5).length}/${awards.length} Unlocked',
                style: EatType.label(11, color: scheme.onSurfaceVariant),
              ),
              TextButton(onPressed: onPassport, child: const Text('Passport')),
            ],
          ),
        ],
      ),
    );
  }
}

class RecentSnapshotFan extends StatelessWidget {
  const RecentSnapshotFan({
    super.key,
    required this.records,
    required this.onHistory,
  });
  final List<ScanRecord>? records;
  final VoidCallback onHistory;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final recent = records?.take(4).toList() ?? [];
    return SectionCard(
      child: Column(
        children: [
          SizedBox(
            height: 140 * math.sqrt(MediaQuery.textScalerOf(context).scale(1)),
            child: InkWell(
              onTap: onHistory,
              child: recent.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            PhosphorIconsRegular.scan,
                            size: 28,
                            color: scheme.onSurfaceVariant,
                          ),
                          Text(
                            records == null
                                ? 'History unavailable'
                                : 'No scanned food snapshots yet',
                          ),
                        ],
                      ),
                    )
                  : LayoutBuilder(
                      builder: (context, limits) {
                        final spread = math.min(
                          54.0,
                          (limits.maxWidth - 90) /
                              math.max(1, recent.length - 1),
                        );
                        final total = 90 + spread * (recent.length - 1);
                        return Stack(
                          alignment: Alignment.center,
                          children: [
                            for (var i = 0; i < recent.length; i++)
                              Positioned(
                                left:
                                    (limits.maxWidth - total) / 2 + i * spread,
                                top: 13,
                                child: Transform.rotate(
                                  angle: [-.105, .07, -.052, .087][i],
                                  child: Container(
                                    width: 90,
                                    height: 110,
                                    padding: const EdgeInsets.all(5),
                                    decoration: BoxDecoration(
                                      color: scheme.surfaceContainer,
                                      border: Border.all(
                                        color: scheme.outlineVariant,
                                      ),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Column(
                                      children: [
                                        Expanded(
                                          child: ColoredBox(
                                            color: scheme.primary.withValues(
                                              alpha: .12,
                                            ),
                                            child: Center(
                                              child: Icon(
                                                PhosphorIconsRegular.scan,
                                                color: scheme.primary,
                                                size: 20,
                                              ),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          recent[i].result.name.isEmpty
                                              ? 'Food Item'
                                              : recent[i].result.name,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: EatType.label(
                                            10,
                                            color: scheme.onSurface,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        );
                      },
                    ),
            ),
          ),
          Wrap(
            spacing: 8,
            runSpacing: 4,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Text(
                'Recent Snapshots',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              if (records != null)
                Text(
                  '${records!.length}',
                  style: EatType.label(11, color: scheme.onSurfaceVariant),
                ),
              TextButton(onPressed: onHistory, child: const Text('History')),
            ],
          ),
        ],
      ),
    );
  }
}

class AnnualDensity extends StatelessWidget {
  const AnnualDensity({
    super.key,
    required this.months,
    required this.yearScans,
    required this.cleanPercent,
    required this.haptics,
  });
  final List<int>? months;
  final int? yearScans, cleanPercent;
  final bool haptics;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final peak = math.max(1, months == null ? 0 : months!.reduce(math.max));
    final active = months?.where((n) => n > 0).length;
    const labels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    return SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              _summary(
                context,
                yearScans?.toString() ?? '—',
                'SCANS THIS YEAR',
                scheme.onSurface,
              ),
              _summary(
                context,
                cleanPercent == null ? '—' : '$cleanPercent%',
                'CLEAN FOODS',
                scheme.primary,
              ),
              _summary(
                context,
                active == null ? '—' : '$active/12',
                'ACTIVE MONTHS',
                scheme.onSurface,
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 76,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                for (var m = 0; m < 12; m++)
                  Expanded(
                    child: Tooltip(
                      message:
                          '${labels[m]}: ${months == null ? 'unavailable' : months![m]} scans',
                      child: InkWell(
                        onTap: () {
                          if (haptics) HapticFeedback.selectionClick();
                        },
                        child: Column(
                          children: [
                            Expanded(
                              child: Align(
                                alignment: Alignment.bottomCenter,
                                child: FractionallySizedBox(
                                  heightFactor:
                                      months == null || months![m] == 0
                                      ? .08
                                      : months![m] / peak,
                                  child: Container(
                                    margin: const EdgeInsets.symmetric(
                                      horizontal: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: m == DateTime.now().month - 1
                                          ? scheme.primary
                                          : months == null || months![m] == 0
                                          ? scheme.surfaceContainerHighest
                                          : scheme.onSurface.withValues(
                                              alpha: .4,
                                            ),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 5),
                            Text(
                              labels[m],
                              style: EatType.label(
                                10,
                                color: m == DateTime.now().month - 1
                                    ? scheme.primary
                                    : scheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 4,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Text(
                'Annual Density',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              Text(
                '12 Months',
                style: EatType.label(11, color: scheme.onSurfaceVariant),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _summary(
    BuildContext context,
    String value,
    String label,
    Color color,
  ) => Expanded(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        FittedBox(
          fit: BoxFit.scaleDown,
          child: Text(value, style: EatType.numeric(18, color: color)),
        ),
        Text(
          label,
          maxLines: 2,
          style: EatType.label(
            9,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    ),
  );
}
