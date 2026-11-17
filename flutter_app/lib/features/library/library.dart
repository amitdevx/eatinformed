import 'dart:convert';

import 'package:flutter/services.dart';

import '../../core/network/json_fields.dart';

class FoodLibrary {
  FoodLibrary({
    required this.nova,
    required this.additives,
    required this.samples,
  });
  final List<Map<String, dynamic>> nova, additives, samples;
  static Future<FoodLibrary> load() async {
    Future<List<Map<String, dynamic>>> read(String name) async => (jsonDecode(
      await rootBundle.loadString('assets/content/$name.json'),
    ) as List).map(jsonObject).toList();
    final data = await Future.wait(['nova', 'additives', 'samples'].map(read));
    return FoodLibrary(nova: data[0], additives: data[1], samples: data[2]);
  }
}
