import 'package:material_ui/material_ui.dart';

class SelectionPills<T> extends StatelessWidget {
  const SelectionPills({
    super.key,
    required this.options,
    required this.selected,
    required this.onChanged,
    this.grouped = false,
  });
  final List<(T, String)> options;
  final T selected;
  final ValueChanged<T> onChanged;
  final bool grouped;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final reduced = MediaQuery.disableAnimationsOf(context);
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Container(
        padding: grouped ? const EdgeInsets.all(4) : EdgeInsets.zero,
        decoration: grouped
            ? BoxDecoration(
                color: scheme.surfaceContainer,
                borderRadius: BorderRadius.circular(26),
                border: Border.all(color: scheme.outlineVariant),
              )
            : null,
        child: Row(
          children: [
            for (final option in options)
              Padding(
                padding: EdgeInsets.only(
                  right: grouped || option == options.last ? 0 : 8,
                ),
                child: Semantics(
                  button: true,
                  selected: selected == option.$1,
                  child: InkWell(
                    onTap: () => onChanged(option.$1),
                    borderRadius: BorderRadius.circular(22),
                    child: AnimatedContainer(
                      duration: reduced
                          ? Duration.zero
                          : const Duration(milliseconds: 260),
                      curve: Curves.easeOutCubic,
                      constraints: const BoxConstraints(minHeight: 40),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 9,
                      ),
                      decoration: BoxDecoration(
                        color: selected == option.$1
                            ? scheme.primary
                            : grouped
                            ? Colors.transparent
                            : scheme.surfaceContainer,
                        border: grouped
                            ? null
                            : Border.all(
                                color: selected == option.$1
                                    ? scheme.primary
                                    : scheme.outlineVariant,
                              ),
                        borderRadius: BorderRadius.circular(22),
                      ),
                      child: Center(
                        child: Text(
                          option.$2,
                          style: Theme.of(context).textTheme.labelMedium
                              ?.copyWith(
                                color: selected == option.$1
                                    ? scheme.onPrimary
                                    : scheme.onSurfaceVariant,
                                fontWeight: selected == option.$1
                                    ? FontWeight.w800
                                    : FontWeight.w600,
                              ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
