import 'package:material_ui/material_ui.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../../core/data/account_state.dart';
import '../../core/data/models.dart';
import '../../design/motion/entrance.dart';
import '../../design/widgets/content_frame.dart';
import '../../design/widgets/eatinformed_mark.dart';
import '../../design/widgets/surfaces.dart';
import '../library/library.dart';
import 'home_visuals.dart';

class _SampleTile extends StatelessWidget {
  const _SampleTile({required this.sample, required this.onOpen});
  final Map<String, dynamic> sample;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final result = ProductResult(
      Map<String, dynamic>.from(sample['data'] as Map),
    );
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onOpen,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            sample['title'] as String,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          Text(sample['subtitle'] as String),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Icon(PhosphorIconsRegular.caretRight, size: 18),
                  ],
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 12,
                  runSpacing: 6,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          PhosphorIconsFill.star,
                          size: 15,
                          color: scheme.primary,
                        ),
                        const SizedBox(width: 5),
                        Flexible(
                          child: Text(
                            result.rating == null
                                ? 'Rating unavailable'
                                : '${result.rating!.toStringAsFixed(1)} / 5 AI estimate',
                          ),
                        ),
                      ],
                    ),
                    Text(
                      result.nova == null
                          ? 'NOVA unavailable'
                          : 'NOVA ${result.nova}',
                      style: Theme.of(context).textTheme.labelMedium,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({
    super.key,
    required this.haptics,
    required this.state,
    required this.library,
    required this.onScan,
    required this.onTab,
    required this.onSample,
  });
  final bool haptics;
  final AccountState state;
  final FoodLibrary library;
  final VoidCallback onScan;
  final ValueChanged<int> onTab;
  final ValueChanged<ProductResult> onSample;
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: state,
    builder: (context, _) {
      final rated = state.records
          ?.where((e) => e.result.rating != null)
          .toList();
      final average = rated == null || rated.isEmpty
          ? null
          : rated.fold<double>(0, (v, e) => v + e.result.rating!) /
                rated.length;
      final days = List<RatingDay>.generate(7, (index) {
        final date = DateUtils.dateOnly(DateTime.now())
            .subtract(Duration(days: 6 - index));
        final values = state.records
            ?.where(
              (e) =>
                  DateUtils.isSameDay(e.createdAt, date) &&
                  e.result.rating != null,
            )
            .map((e) => e.result.rating!)
            .toList();
        final rating = values == null || values.isEmpty
            ? null
            : values.reduce((a, b) => a + b) / values.length;
        return RatingDay(date, rating);
      });
      return RefreshIndicator(
        onRefresh: state.load,
        child: ContentFrame(
          bottomOverlayClearance: 106,
          slivers: [
            SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      EatInformedMark(
                        leaf: Theme.of(context).colorScheme.primary,
                        ink: Theme.of(context).colorScheme.onSurface,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'EatInformed',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                      ),
                    ],
                  ),
                  Padding(
                    padding: const EdgeInsets.only(top: 12, bottom: 24),
                    child: Semantics(
                      header: true,
                      child: Text.rich(
                        TextSpan(
                          children: [
                            const TextSpan(text: 'Food clarity.\n'),
                            TextSpan(
                              text: 'For what you eat.',
                              style: TextStyle(
                                color: Theme.of(context)
                                    .colorScheme
                                    .onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                        style: Theme.of(context).textTheme.headlineLarge,
                      ),
                    ),
                  ),
                  const Text(
                    'Scan any ingredient list or nutrition panel for NOVA food processing classifications, additive alerts, and AI rating estimates.',
                  ),
                  const SizedBox(height: 24),
                  if (state.error != null)
                    Notice(state.error!, onRetry: state.load),
                  SectionCard(
                    entrance: true,
                    scrollEffect: true,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            RatingRing(average),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Dietary Clarity Index',
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleLarge,
                                  ),
                                  Text(
                                    state.records == null
                                        ? 'History unavailable'
                                        : state.records!.isEmpty
                                        ? 'Read labels and estimate food processing'
                                        : 'Average of available AI rating estimates',
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        if (state.records != null) ...[
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 14,
                            runSpacing: 6,
                            children: [
                              Text('${state.records!.length} saved scans'),
                              Text('${rated!.length} rated reports'),
                            ],
                          ),
                        ],
                        const SizedBox(height: 16),
                        FilledButton.icon(
                          onPressed: onScan,
                          icon: const Icon(Icons.document_scanner_outlined),
                          label: const Text('Scan Food Label'),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 4,
                          runSpacing: 4,
                          children: [
                            TextButton.icon(
                              onPressed: () => onTab(1),
                              icon: const Icon(
                                PhosphorIconsRegular.clockCounterClockwise,
                                size: 16,
                              ),
                              label: const Text('History'),
                            ),
                            TextButton.icon(
                              onPressed: () => onTab(2),
                              icon: const Icon(
                                PhosphorIconsRegular.bookOpen,
                                size: 16,
                              ),
                              label: const Text('NOVA Guide'),
                            ),
                            TextButton.icon(
                              onPressed: () => onTab(3),
                              icon: const Icon(
                                PhosphorIconsRegular.userCircle,
                                size: 16,
                              ),
                              label: const Text('Account'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  SectionCard(
                    index: 1,
                    entrance: true,
                    scrollEffect: true,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '7-Day Nutritional Clarity',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const Text('Average available AI ratings over time'),
                        const SizedBox(height: 16),
                        SevenDayTrend(days: days, haptics: haptics),
                      ],
                    ),
                  ),
                  const PageHeading(
                    'Try Instant Samples',
                    subtitle: 'Compare real products across the NOVA food processing spectrum',
                  ),
                  for (var index = 0; index < library.samples.length; index++)
                    Entrance(
                      index: 3 + index,
                      child: _SampleTile(
                        sample: library.samples[index],
                        onOpen: () => onSample(
                          ProductResult(
                            Map<String, dynamic>.from(
                              library.samples[index]['data'] as Map,
                            ),
                          ),
                        ),
                      ),
                    ),
                  SectionCard(
                    onTap: () => onTab(2),
                    child: Row(
                      children: [
                        const Icon(PhosphorIconsRegular.bookOpen, size: 20),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'The NOVA Standard',
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                              const Text(
                                'Developed at the University of Sao Paulo to classify foods by the extent and purpose of industrial processing. Explore our guide to learn more.',
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Icon(PhosphorIconsRegular.caretRight, size: 18),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    },
  );
}
