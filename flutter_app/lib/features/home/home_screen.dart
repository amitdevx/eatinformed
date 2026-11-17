import 'package:material_ui/material_ui.dart';

import '../../core/data/account_state.dart';
import '../../core/data/models.dart';
import '../../design/widgets/content_frame.dart';
import '../../design/widgets/eatinformed_mark.dart';
import '../../design/widgets/surfaces.dart';
import '../library/library.dart';
import 'home_visuals.dart';

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
                  const PageHeading('Food clarity.\nFor what you eat.'),
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
                                        : '${state.records!.length} product audits logged',
                                  ),
                                ],
                              ),
                            ),
                          ],
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
                    SectionCard(
                      index: 3 + index,
                      entrance: true,
                      onTap: () => onSample(
                        ProductResult(
                          Map<String, dynamic>.from(
                            library.samples[index]['data'] as Map,
                          ),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            library.samples[index]['title'] as String,
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          Text(library.samples[index]['subtitle'] as String),
                          NovaLabel(library.samples[index]['novaGroup'] as int),
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
