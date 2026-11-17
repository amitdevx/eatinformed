import 'package:material_ui/material_ui.dart';

import '../../design/widgets/content_frame.dart';
import '../../design/widgets/surfaces.dart';
import 'library.dart';

class GuideScreen extends StatefulWidget {
  const GuideScreen({super.key, required this.library});
  final FoodLibrary library;
  @override
  State<GuideScreen> createState() => _GuideScreenState();
}

class _GuideScreenState extends State<GuideScreen> {
  bool _additives = false;
  String _search = '';
  void _details(Map<String, dynamic> item, {bool additive = false}) =>
      glassSheet<void>(
        context,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              (item['title'] ?? item['name']) as String,
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 12),
            if (item['group'] != null || item['novaGroup'] != null)
              NovaLabel((item['group'] ?? item['novaGroup']) as int?),
            if (item['code'] != null) Text(item['code'] as String),
            const SizedBox(height: 16),
            SelectableText(item['description'] as String),
            if (additive) ...[
              const SizedBox(height: 24),
              Text(
                'COMMON SOURCES',
                style: Theme.of(context).textTheme.labelLarge,
              ),
              Text(item['foundIn'] as String),
            ] else ...[
              const SizedBox(height: 20),
              const Text('TYPICAL EXAMPLES'),
              for (final example in item['examples'] as List)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(example as String),
                ),
              const SizedBox(height: 20),
              Text(item['impact'] as String),
            ],
            const SizedBox(height: 24),
            const Text(
              'General reference. Classification does not establish allergy safety.',
            ),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ],
        ),
      );
  @override
  Widget build(BuildContext context) {
    final rows = _additives
        ? widget.library.additives
              .where(
                (a) => ['name', 'code', 'category', 'foundIn'].any(
                  (k) => (a[k]?.toString() ?? '').toLowerCase().contains(
                    _search.toLowerCase(),
                  ),
                ),
              )
              .toList()
        : widget.library.nova;
    return ContentFrame(
      bottomOverlayClearance: 106,
      slivers: [
        SliverToBoxAdapter(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const PageHeading(
                'Food Safety Guide',
                subtitle: 'NOVA classification standards & offline additive reference',
              ),
              Wrap(
                spacing: 8,
                children: [
                  ChoiceChip(
                    label: const Text('NOVA Groups (1-4)'),
                    selected: !_additives,
                    onSelected: (_) => setState(() => _additives = false),
                  ),
                  ChoiceChip(
                    label: Text(
                      'Additive Dictionary (${widget.library.additives.length})',
                    ),
                    selected: _additives,
                    onSelected: (_) => setState(() => _additives = true),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (_additives)
                TextField(
                  decoration: const InputDecoration(
                    labelText:
                        'Search by name, E-number (e.g. E407, Red 40)...',
                    prefixIcon: Icon(Icons.search),
                  ),
                  onChanged: (v) => setState(() => _search = v),
                )
              else
                const Text(
                  'Developed by epidemiologists at the University of Sao Paulo, NOVA categorizes foods into 4 groups by the extent and purpose of industrial processing. Tap or long press any card to read more about the classification.',
                ),
              const SizedBox(height: 20),
              if (_additives) Text('${rows.length} reference entries found'),
              const SizedBox(height: 12),
            ],
          ),
        ),
        SliverList.builder(
          itemCount: rows.length,
          itemBuilder: (context, index) {
            final row = rows[index];
            return SectionCard(
              index: index,
              onTap: () => _details(row, additive: _additives),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (row['group'] != null || row['novaGroup'] != null)
                    NovaLabel((row['group'] ?? row['novaGroup']) as int?),
                  if (row['code'] != null) Text(row['code'] as String),
                  Text(
                    (row['title'] ?? row['name']) as String,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  Text(row['description'] as String),
                  if (_additives) ...[
                    const SizedBox(height: 12),
                    Text(switch (row['riskLevel']) {
                      'caution' => 'Caution / Limit',
                      'moderate' => 'Moderate',
                      'safe' => 'Generally Safe',
                      _ => 'Risk information unavailable',
                    }),
                    const SizedBox(height: 12),
                    Text('COMMON SOURCES\n${row['foundIn']}'),
                  ] else ...[
                    const SizedBox(height: 12),
                    for (final ex in row['examples'] as List)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Text(ex as String),
                      ),
                    Text(row['impact'] as String),
                  ],
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}
