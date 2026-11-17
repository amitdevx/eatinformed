import 'package:material_ui/material_ui.dart';

import '../../core/data/account_state.dart';
import '../../core/data/models.dart';
import '../../design/widgets/content_frame.dart';
import '../../design/widgets/surfaces.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({
    super.key,
    required this.state,
    required this.onOpen,
    required this.onScan,
  });
  final AccountState state;
  final ValueChanged<ScanRecord> onOpen;
  final VoidCallback onScan;
  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  int? _filter;
  Future<void> _delete(ScanRecord item) async {
    final yes = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Scan'),
        content: Text(
          'Remove "${item.result.name}" from your saved scan history?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (yes == true) {
      try {
        await widget.state.delete(item.id);
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context)
              .showSnackBar(SnackBar(content: Text('$e')));
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: widget.state,
    builder: (context, _) {
      final state = widget.state, all = state.records;
      final items = all
          ?.where(
            (e) =>
                _filter == null ||
                (_filter == 1
                    ? (e.result.nova != null && e.result.nova! <= 2)
                    : e.result.nova == _filter),
          )
          .toList();
      return RefreshIndicator(
        onRefresh: state.load,
        child: ContentFrame(
          bottomOverlayClearance: 106,
          slivers: [
            SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  PageHeading(
                    'Scan History',
                    subtitle: all == null
                        ? 'Loading saved reports'
                        : '${all.length} saved reports in your account',
                  ),
                  if (state.error != null)
                    Notice(state.error!, onRetry: state.load),
                  Wrap(
                    spacing: 8,
                    children: [
                      for (final filter in [
                        (null, 'All'),
                        (1, 'Clean (1-2)'),
                        (3, 'Processed (3)'),
                        (4, 'Ultra (4)'),
                      ])
                        ChoiceChip(
                          label: Text(filter.$2),
                          selected: _filter == filter.$1,
                          onSelected: (_) =>
                              setState(() => _filter = filter.$1),
                        ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  if (all != null)
                    SectionCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '30-Day Nutrition Consistency',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 16),
                          Wrap(
                            spacing: 5,
                            runSpacing: 5,
                            children: List.generate(30, (i) {
                              final day = DateUtils.dateOnly(DateTime.now())
                                  .subtract(Duration(days: 29 - i));
                              final count = all
                                  .where(
                                    (e) =>
                                        DateUtils.isSameDay(e.createdAt, day),
                                  )
                                  .length;
                              return Tooltip(
                                message:
                                    '${day.month}/${day.day}: $count scans',
                                child: Semantics(
                                  label:
                                      '${day.month}/${day.day}: $count scans',
                                  child: Container(
                                    width: 30,
                                    height: 30,
                                    decoration: BoxDecoration(
                                      color: count > 0
                                          ? Theme.of(context)
                                                .colorScheme
                                                .primary
                                          : Theme.of(context)
                                                .colorScheme
                                                .surfaceContainerHighest,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                  ),
                                ),
                              );
                            }),
                          ),
                          const SizedBox(height: 12),
                          const Text('Activity from saved scan records'),
                        ],
                      ),
                    ),
                  if (state.loading) const LinearProgressIndicator(),
                  if (items != null && items.isEmpty)
                    SectionCard(
                      child: Column(
                        children: [
                          const Icon(Icons.history, size: 48),
                          const SizedBox(height: 16),
                          Text(
                            all!.isEmpty
                                ? 'No Saved Scans Yet'
                                : 'No matching reports',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const Text(
                            'Point your camera at any food ingredient label or explore instant samples from the Home screen.',
                          ),
                          const SizedBox(height: 16),
                          FilledButton(
                            onPressed: widget.onScan,
                            child: const Text('Start Scanning'),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            SliverList.builder(
              itemCount: items?.length ?? 0,
              itemBuilder: (context, index) {
                final item = items![index];
                return SectionCard(
                  onTap: () => widget.onOpen(item),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              item.result.name.isEmpty
                                  ? 'Food label'
                                  : item.result.name,
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                          ),
                          IconButton(
                            onPressed: () => _delete(item),
                            tooltip: 'Delete ${item.result.name}',
                            icon: const Icon(Icons.delete_outline),
                          ),
                        ],
                      ),
                      Text(item.result.brand),
                      Wrap(
                        spacing: 12,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Text(
                            item.result.rating == null
                                ? 'Unrated'
                                : '${item.result.rating!.toStringAsFixed(1)} / 5.0',
                          ),
                          NovaLabel(item.result.nova),
                        ],
                      ),
                      Text(
                        MaterialLocalizations.of(context)
                            .formatMediumDate(item.createdAt),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      );
    },
  );
}
