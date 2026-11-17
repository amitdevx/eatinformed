import 'package:material_ui/material_ui.dart';

import '../../core/data/models.dart';
import '../../core/data/sharing.dart';
import '../../core/network/json_fields.dart';
import '../../design/widgets/content_frame.dart';
import '../../design/widgets/surfaces.dart';
import '../library/library.dart';
import 'allergen_matches.dart';

class ResultScreen extends StatefulWidget {
  const ResultScreen({
    super.key,
    required this.result,
    required this.library,
    this.sample = false,
    this.onScan,
    this.allergens = const [],
  });
  final ProductResult result;
  final FoodLibrary library;
  final bool sample;
  final VoidCallback? onScan;
  final List<String> allergens;
  @override
  State<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends State<ResultScreen> {
  int _tab = 0;
  Future<void> _share() async {
    final format = await glassSheet<String>(
      context,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Share Product Report',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 20),
          OutlinedButton.icon(
            onPressed: () => Navigator.pop(context, 'text'),
            icon: const Icon(Icons.notes),
            label: const Text('Share as Text Summary'),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => Navigator.pop(context, 'json'),
            icon: const Icon(Icons.data_object),
            label: const Text('Share as JSON File'),
          ),
        ],
      ),
    );
    if (!mounted) return;
    final result = widget.result;
    if (format == 'text') {
      await shareText(
        context,
        '${result.name}${result.brand.isEmpty ? '' : ' (${result.brand})'}\nAI rating estimate: ${result.rating?.toStringAsFixed(1) ?? 'Unknown'}/5.0\nNOVA Group: ${result.nova ?? 'Unknown'}\nAnalyzed with EatInformed. Check the original label.',
        title: 'EatInformed Product Report',
      );
    } else if (format == 'json') {
      await shareJson(
        context,
        result.json,
        filename: 'eatinformed-product-report.json',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.result, d = r.dietary;
    final matches = personalAllergenMatches(widget.allergens, [
      ...r.ingredients,
      ...stringList(d['allergens']),
      ...r.list('warnings'),
    ]);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Product Report'),
        actions: [
          IconButton(
            onPressed: _share,
            tooltip: 'Share report',
            icon: const Icon(Icons.ios_share),
          ),
        ],
      ),
      body: ContentFrame(
        slivers: [
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (widget.sample)
                  const Notice(
                    'Instant sample. This example is not part of your scan history.',
                  ),
                if (matches.isNotEmpty)
                  SectionCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Your allergen flags',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const Text(
                          'Matching text in the available report. Verify the original label, including contains and may-contain warnings.',
                        ),
                        for (final entry in matches.entries)
                          Text('${entry.key}: ${entry.value.join('; ')}'),
                      ],
                    ),
                  ),
                PageHeading(
                  r.name.isEmpty ? 'Product report' : r.name,
                  subtitle: r.brand.isEmpty ? null : r.brand,
                ),
                SectionCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        r.rating == null
                            ? 'Rating unavailable'
                            : '${r.rating!.toStringAsFixed(1)} / 5.0',
                        style: Theme.of(context).textTheme.displaySmall,
                      ),
                      const Text('AI rating estimate'),
                      NovaLabel(r.nova),
                      const Text(
                        'Food classifications and ratings are estimates, not clinically validated health scores.',
                      ),
                    ],
                  ),
                ),
                Wrap(
                  spacing: 8,
                  children: [
                    for (var i = 0; i < 3; i++)
                      ChoiceChip(
                        label: Text(
                          [
                            'Overview',
                            'Ingredients (${r.ingredients.length})',
                            'Nutrition Facts',
                          ][i],
                        ),
                        selected: _tab == i,
                        onSelected: (_) => setState(() => _tab = i),
                      ),
                  ],
                ),
                const SizedBox(height: 20),
                if (_tab == 0) ...[
                  if (r.list('warnings').isNotEmpty)
                    _section('Health Notices', r.list('warnings')),
                  _section('Health Benefits & Pros', r.list('pros')),
                  _section('Concerns', r.list('cons')),
                  SectionCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Dietary & Allergen Profile',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 12),
                        for (final field in [
                          ('isVegetarian', 'Vegetarian'),
                          ('isVegan', 'Vegan'),
                          ('isGlutenFree', 'Gluten free'),
                        ])
                          Text(
                            '${field.$2}: ${d[field.$1] == null
                                ? 'Unknown'
                                : d[field.$1] == true
                                ? 'Label-based estimate: yes'
                                : 'Label-based estimate: no'}',
                          ),
                        ...stringList(d['allergens'])
                            .map((e) => Text('Allergen information: $e')),
                        if (d['summary'] is String)
                          Padding(
                            padding: const EdgeInsets.only(top: 12),
                            child: Text(d['summary'] as String),
                          ),
                        const SizedBox(height: 12),
                        const Text(
                          'No matching allergen is not a guarantee of safety. Check the full label and declared may-contain statements.',
                        ),
                      ],
                    ),
                  ),
                ],
                if (_tab == 1) ...[
                  if (r.ingredients.isEmpty)
                    const Notice('Ingredient information unavailable.'),
                  for (final ingredient in r.ingredients)
                    SectionCard(
                      onTap: () {
                        final matches = widget.library.additives.where(
                          (a) =>
                              ingredient.toLowerCase().contains(
                                (a['name'] as String).toLowerCase(),
                              ) ||
                              (a['code'] != null &&
                                  RegExp(
                                    r'\b' +
                                        RegExp.escape(a['code'] as String) +
                                        r'\b',
                                    caseSensitive: false,
                                  ).hasMatch(ingredient)),
                        );
                        glassSheet<void>(
                          context,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                ingredient,
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                              const SizedBox(height: 16),
                              for (final match in matches) ...[
                                Text(match['description'] as String),
                                Text('COMMON SOURCES: ${match['foundIn']}'),
                              ],
                              if (matches.isEmpty)
                                const Text(
                                  'No matching additive reference. This does not establish safety.',
                                ),
                            ],
                          ),
                        );
                      },
                      child: Text(ingredient),
                    ),
                  for (final raw
                      in (r.json['ingredientAnalysis'] as List? ?? []))
                    Builder(
                      builder: (context) {
                        final item = jsonObject(raw);
                        return SectionCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item['ingredient'] as String? ?? '',
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              Text(item['description'] as String? ?? ''),
                              Text(item['purpose'] as String? ?? ''),
                              if (item['isAllergen'] == true)
                                const Text(
                                  'Possible allergen: check the label',
                                ),
                            ],
                          ),
                        );
                      },
                    ),
                ],
                if (_tab == 2) ...[
                  SectionCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Nutritional Panel',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        if (r.nutrition['servingSizeLabel'] != null)
                          Text(
                            'Serving Size: ${r.nutrition['servingSizeLabel']}',
                          ),
                        const SizedBox(height: 16),
                        for (final raw
                            in r.nutrition['nutrients'] as List? ?? [])
                          Builder(
                            builder: (context) {
                              final row = jsonObject(raw);
                              return Padding(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 10,
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      row['nutrient'] as String,
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleMedium,
                                    ),
                                    for (final basis in [
                                      ('perServing', 'Per Serve'),
                                      ('per100g', 'Per 100 g'),
                                      ('per100mL', 'Per 100 mL'),
                                    ])
                                      if (row[basis.$1] != null)
                                        Text('${basis.$2}: ${row[basis.$1]}'),
                                  ],
                                ),
                              );
                            },
                          ),
                        if ((r.nutrition['nutrients'] as List? ?? []).isEmpty)
                          const Text('Nutrition values unavailable.'),
                        const SizedBox(height: 16),
                        SelectableText(r.nutrition['rawText'] as String? ?? ''),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Back'),
                ),
                if (widget.onScan != null)
                  OutlinedButton(
                    onPressed: widget.onScan,
                    child: const Text('Scan Another Label'),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _section(String title, List<String> items) => items.isEmpty
      ? const SizedBox.shrink()
      : SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              for (final item in items)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(item),
                ),
            ],
          ),
        );
}
