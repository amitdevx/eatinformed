Map<String, dynamic> jsonObject(Object? value) {
  if (value is! Map<String, dynamic>) {
    throw const FormatException('Expected a JSON object.');
  }
  return value;
}

String requiredText(Map<String, dynamic> value, String key) {
  final field = value[key];
  if (field is! String || field.isEmpty) throw FormatException('Missing $key.');
  return field;
}

String? optionalText(Map<String, dynamic> value, String key) {
  final field = value[key];
  if (field != null && field is! String) throw FormatException('Invalid $key.');
  return field as String?;
}
