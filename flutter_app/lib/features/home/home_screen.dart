import 'package:material_ui/material_ui.dart';

import '../../core/data/account_state.dart';
import '../../design/motion/rolling_value.dart';
import '../../core/data/models.dart';
import '../../design/widgets/content_frame.dart';
import '../../design/widgets/eatinformed_mark.dart';
import '../../design/widgets/surfaces.dart';
import '../library/library.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({
    super.key,
    required this.name,
    required this.state,
    required this.library,
    required this.onScan,
    required this.onTab,
    required this.onSample,
  });
  final String name;
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
      return RefreshIndicator(
        onRefresh: state.load,
        child: ContentFrame(
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
                  const PageHeading('Food clarity.\nFor what you eat.'),
                  Text(name, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 12),
                  const Text(
                    'Scan any ingredient list or nutrition panel for NOVA food processing classifications, additive alerts, and AI rating estimates.',
                  ),
                  const SizedBox(height: 24),
                  if (state.error != null)
                    Notice(state.error!, onRetry: state.load),
                  SectionCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Dietary Clarity Index',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 16),
                        RollingValue(
                          average == null
                              ? 'Rating unavailable'
                              : '${average.toStringAsFixed(1)} / 5',
                          style: Theme.of(context).textTheme.displaySmall,
                        ),
                        Text(
                          state.records == null
                              ? 'History unavailable'
                              : state.records!.isEmpty
                              ? 'Read labels and estimate food processing'
                              : '${state.records!.length} product audits logged',
                        ),
                        const SizedBox(height: 16),
                        FilledButton.icon(
                          onPressed: onScan,
                          icon: const Icon(Icons.document_scanner_outlined),
                          label: const Text('Scan Food Label'),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          children: [
                            TextButton(
                              onPressed: () => onTab(1),
                              child: const Text('History'),
                            ),
                            TextButton(
                              onPressed: () => onTab(2),
                              child: const Text('NOVA Guide'),
                            ),
                            TextButton(
                              onPressed: () => onTab(3),
                              child: const Text('Account'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  SectionCard(
                    index: 1,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '7-Day Nutritional Clarity',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const Text('Average available AI ratings over time'),
                        const SizedBox(height: 16),
                        for (var i = 6; i >= 0; i--)
                          Builder(
                            builder: (context) {
                              final date = DateUtils.dateOnly(DateTime.now())
                                  .subtract(Duration(days: i));
                              final values = state.records
                                  ?.where(
                                    (e) =>
                                        DateUtils.isSameDay(
                                          e.createdAt,
                                          date,
                                        ) &&
                                        e.result.rating != null,
                                  )
                                  .map((e) => e.result.rating!)
                                  .toList();
                              final score = values == null || values.isEmpty
                                  ? null
                                  : values.reduce((a, b) => a + b) /
                                        values.length;
                              return Padding(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 6,
                                ),
                                child: Row(
                                  children: [
                                    SizedBox(
                                      width: 64,
                                      child: Text('${date.month}/${date.day}'),
                                    ),
                                    Expanded(
                                      child: LinearProgressIndicator(
                                        value: (score ?? 0) / 5,
                                        minHeight: 6,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Text(
                                      score?.toStringAsFixed(1) ?? 'No rating',
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                      ],
                    ),
                  ),
                  const PageHeading(
                    'Try Instant Samples',
                    subtitle: 'Compare real products across the NOVA food processing spectrum',
                  ),
                  for (final sample in library.samples)
                    SectionCard(
                      onTap: () => onSample(
                        ProductResult(
                          Map<String, dynamic>.from(sample['data'] as Map),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            sample['title'] as String,
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          Text(sample['subtitle'] as String),
                          NovaLabel(sample['novaGroup'] as int),
                          const Text('Sample report'),
                        ],
                      ),
                    ),
                  SectionCard(
                    onTap: () => onTab(2),
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
                ],
              ),
            ),
          ],
        ),
      );
    },
  );
}
