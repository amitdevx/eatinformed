import 'dart:math' as math;

import 'package:material_ui/material_ui.dart';

import '../../core/data/models.dart';
import '../../design/tokens.dart';

class ActivityHeatmap extends StatefulWidget {
  const ActivityHeatmap({super.key, required this.records});
  final List<ScanRecord> records;

  @override
  State<ActivityHeatmap> createState() => _ActivityHeatmapState();
}

class _ActivityHeatmapState extends State<ActivityHeatmap> {
  int? _selected;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final days = List.generate(
      30,
      (i) =>
          DateUtils.dateOnly(DateTime.now()).subtract(Duration(days: 29 - i)),
    );
    final groups = [
      for (final day in days)
        widget.records
            .where((r) => DateUtils.isSameDay(r.createdAt, day))
            .toList(),
    ];
    final averages = [
      for (final items in groups)
        items.where((r) => r.result.rating != null).isEmpty
            ? null
            : items
                      .where((r) => r.result.rating != null)
                      .fold<double>(0, (v, r) => v + r.result.rating!) /
                  items.where((r) => r.result.rating != null).length,
    ];
    final selected = _selected == null ? null : days[_selected!];
    final label = selected == null
        ? 'Tap day to inspect'
        : '${selected.month}/${selected.day}: ${groups[_selected!].length} ${groups[_selected!].length == 1 ? 'scan' : 'scans'}${averages[_selected!] == null ? '' : ' · ${averages[_selected!]!.toStringAsFixed(1)} score'}';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Wrap(
          spacing: 8,
          runSpacing: 4,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            Text(
              '30-Day Nutrition Consistency',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            Text(
              label,
              style: EatType.label(
                11,
                color: selected == null
                    ? scheme.onSurfaceVariant
                    : scheme.primary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        LayoutBuilder(
          builder: (context, limits) {
            final cell = math.max(1.0, (limits.maxWidth - 5 * 6) / 6);
            return Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                for (var i = 0; i < days.length; i++)
                  Semantics(
                    button: true,
                    label:
                        '${days[i].month}/${days[i].day}: ${groups[i].length} scans',
                    child: GestureDetector(
                      onTap: () => setState(() => _selected = i),
                      child: Container(
                        width: cell,
                        height: cell,
                        decoration: BoxDecoration(
                          color: averages[i] == null
                              ? scheme.surfaceContainerHighest
                              : averages[i]! >= 4.2
                              ? scheme.primary
                              : averages[i]! >= 3
                              ? const Color(0xFFFBBF24)
                              : scheme.error,
                          border: Border.all(
                            color: _selected == i
                                ? scheme.onSurface
                                : Colors.transparent,
                            width: 1.5,
                          ),
                          borderRadius: BorderRadius.circular(6),
                        ),
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
        const SizedBox(height: 12),
        Wrap(
          alignment: WrapAlignment.end,
          spacing: 12,
          runSpacing: 6,
          children: [
            _legend(
              scheme.surfaceContainerHighest,
              'No Scans',
              scheme.onSurfaceVariant,
            ),
            _legend(
              const Color(0xFFFBBF24),
              'Moderate',
              scheme.onSurfaceVariant,
            ),
            _legend(scheme.primary, 'Clean (4.2+)', scheme.onSurfaceVariant),
          ],
        ),
      ],
    );
  }

  Widget _legend(Color swatch, String label, Color text) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Container(
        width: 10,
        height: 10,
        decoration: BoxDecoration(
          color: swatch,
          borderRadius: BorderRadius.circular(3),
        ),
      ),
      const SizedBox(width: 4),
      Text(label, style: EatType.label(10, color: text)),
    ],
  );
}
