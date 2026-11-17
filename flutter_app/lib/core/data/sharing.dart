import 'dart:convert';
import 'dart:typed_data';

import 'package:share_plus/share_plus.dart';
import 'package:material_ui/material_ui.dart';

Future<void> shareJson(
  BuildContext context,
  Map<String, dynamic> data, {
  String filename = 'eatinformed-history.json',
}) async {
  final box = context.findRenderObject() as RenderBox?;
  await _share(
    context,
    ShareParams(
      files: [
        XFile.fromData(
          Uint8List.fromList(
            utf8.encode(const JsonEncoder.withIndent('  ').convert(data)),
          ),
          mimeType: 'application/json',
        ),
      ],
      fileNameOverrides: [filename],
      sharePositionOrigin: box == null
          ? null
          : box.localToGlobal(Offset.zero) & box.size,
    ),
  );
}

Future<void> shareText(
  BuildContext context,
  String text, {
  String? title,
}) async {
  final box = context.findRenderObject() as RenderBox?;
  await _share(
    context,
    ShareParams(
      text: text,
      title: title,
      sharePositionOrigin: box == null
          ? null
          : box.localToGlobal(Offset.zero) & box.size,
    ),
  );
}

Future<void> _share(BuildContext context, ShareParams params) async {
  try {
    await SharePlus.instance.share(params);
  } catch (_) {
    if (context.mounted) {
      ScaffoldMessenger.maybeOf(context)?.showSnackBar(
        const SnackBar(
          content: Text('Could not open sharing. Please try again.'),
        ),
      );
    }
  }
}
