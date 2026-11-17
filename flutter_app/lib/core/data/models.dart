import 'dart:convert';

import '../network/json_fields.dart';

List<String> stringList(Object? value) {
  if (value == null) return [];
  if (value is! List || value.any((e) => e is! String)) {
    throw const FormatException('Invalid text list');
  }
  return value.cast<String>();
}

class ProductResult {
  ProductResult(Map<String, dynamic> value)
    : json = Map.unmodifiable(
        jsonDecode(jsonEncode(value)) as Map<String, dynamic>,
      ) {
    if (value['status'] != 'success') {
      throw const FormatException('Missing successful analysis');
    }
    for (final key in ['productName', 'brand', 'scanId', 'requestId']) {
      if (value[key] != null && value[key] is! String) {
        throw FormatException('Invalid $key');
      }
    }
    final rating = value['rating'], nova = value['novaGroup'];
    if (rating != null &&
        (rating is! num || !rating.isFinite || rating < 0 || rating > 5)) {
      throw const FormatException('Invalid rating');
    }
    if (nova != null &&
        (nova is! num || nova != nova.round() || nova < 1 || nova > 4)) {
      throw const FormatException('Invalid NOVA');
    }
    stringList(value['ingredients']);
    for (final key in ['warnings', 'pros', 'cons']) {
      stringList(value[key]);
    }
    if (value['ingredientAnalysis'] != null) {
      if (value['ingredientAnalysis'] is! List) {
        throw const FormatException('Invalid ingredient analysis');
      }
      for (final raw in value['ingredientAnalysis'] as List) {
        final item = jsonObject(raw);
        requiredText(item, 'ingredient');
        optionalText(item, 'description');
        optionalText(item, 'purpose');
        for (final key in ['isAllergen', 'isControversial']) {
          if (item[key] != null && item[key] is! bool) {
            throw const FormatException('Invalid ingredient flag');
          }
        }
      }
    }
    final nutrition = value['nutrition'];
    if (nutrition != null) {
      final n = jsonObject(nutrition);
      optionalText(n, 'rawText');
      optionalText(n, 'servingSizeLabel');
      if (n['nutrients'] != null) {
        if (n['nutrients'] is! List) {
          throw const FormatException('Invalid nutrients');
        }
        for (final row in n['nutrients'] as List) {
          final r = jsonObject(row);
          requiredText(r, 'nutrient');
          for (final k in ['perServing', 'per100g', 'per100mL']) {
            optionalText(r, k);
          }
        }
      }
    }
    final dietary = value['dietaryInfo'];
    if (dietary != null) {
      final d = jsonObject(dietary);
      stringList(d['allergens']);
      stringList(d['suitability']);
      optionalText(d, 'summary');
      for (final key in ['isVegan', 'isVegetarian', 'isGlutenFree']) {
        if (d[key] != null && d[key] is! bool) {
          throw const FormatException('Invalid dietary flag');
        }
      }
    }
  }
  final Map<String, dynamic> json;
  String get name => json['productName'] as String? ?? '';
  String get brand => json['brand'] as String? ?? '';
  String? get scanId => json['scanId'] as String?;
  double? get rating => (json['rating'] as num?)?.toDouble();
  int? get nova => (json['novaGroup'] as num?)?.toInt();
  List<String> get ingredients => stringList(json['ingredients']);
  List<String> list(String key) => stringList(json[key]);
  Map<String, dynamic> get nutrition =>
      json['nutrition'] == null ? {} : jsonObject(json['nutrition']);
  Map<String, dynamic> get dietary =>
      json['dietaryInfo'] == null ? {} : jsonObject(json['dietaryInfo']);
}

class ScanRecord {
  ScanRecord({required this.id, required this.createdAt, required this.result});
  factory ScanRecord.fromJson(Map<String, dynamic> json) => ScanRecord(
    id: requiredText(json, 'id'),
    createdAt: DateTime.fromMillisecondsSinceEpoch(
      (json['timestamp'] as num).toInt(),
    ),
    result: ProductResult(jsonObject(json['data'])),
  );
  final String id;
  final DateTime createdAt;
  final ProductResult result;
  Map<String, dynamic> toJson() => {
    'id': id,
    'timestamp': createdAt.millisecondsSinceEpoch,
    'data': result.json,
  };
}

class Quota {
  Quota.fromJson(Map<String, dynamic> json)
    : limit = (json['limit'] as num).toInt(),
      remaining = (json['remaining'] as num).toInt(),
      windowSeconds = (json['windowSeconds'] as num).toInt(),
      nextAvailableAt = json['nextAvailableAt'] == null
          ? null
          : DateTime.fromMillisecondsSinceEpoch(
              (json['nextAvailableAt'] as num).toInt(),
            );
  final int limit, remaining, windowSeconds;
  final DateTime? nextAvailableAt;
}
