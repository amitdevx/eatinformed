/// Matches preference text to evidence already returned by the label service.
/// These matches are cautions, never a claim that an absent match is safe.
Map<String, List<String>> personalAllergenMatches(
  List<String> preferences,
  Iterable<String> evidence,
) {
  final rows = evidence.where((e) => e.trim().isNotEmpty).toList();
  final result = <String, List<String>>{};
  for (final preference in preferences) {
    final words = preference
        .trim()
        .toLowerCase()
        .split(RegExp(r'\s+'))
        .where((e) => e.isNotEmpty)
        .toList();
    if (words.isEmpty) continue;
    final pattern = RegExp(
      '(^|[^a-z0-9])${words.map(RegExp.escape).join(r'\s+')}([^a-z0-9]|\$)',
      caseSensitive: false,
    );
    final matches = rows.where(pattern.hasMatch).toList();
    if (matches.isNotEmpty) result[preference] = matches;
  }
  return result;
}
