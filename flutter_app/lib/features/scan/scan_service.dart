import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:image/image.dart' as img;

import '../../core/data/account_repository.dart';
import '../../core/data/models.dart';
import '../../core/network/api_failure.dart';
import '../auth/auth_repository.dart';

Uint8List prepareLabel(Uint8List bytes) {
  if (bytes.length > 20 * 1024 * 1024) {
    throw const FormatException('Choose an image smaller than 20 MB.');
  }
  final decoder = img.findDecoderForData(bytes),
      info = img.findDecoderForData(bytes)?.startDecode(bytes);
  if (decoder == null ||
      info == null ||
      ![
        img.ImageFormat.jpg,
        img.ImageFormat.png,
        img.ImageFormat.webp,
      ].contains(decoder.format)) {
    throw const FormatException('Use a readable JPEG, PNG or WebP photo.');
  }
  if (info.width > 6000 ||
      info.height > 6000 ||
      info.width * info.height > 25000000) {
    throw const FormatException(
      'Image exceeds the 6000 pixel or 25 megapixel limit.',
    );
  }
  final decoded = decoder.decode(bytes);
  if (decoded == null) {
    throw const FormatException('This image could not be read.');
  }
  var image = img.bakeOrientation(decoded);
  if (image.width > 1600 || image.height > 1600) {
    image = img.copyResize(
      image,
      width: image.width >= image.height ? 1600 : null,
      height: image.height > image.width ? 1600 : null,
    );
  }
  for (final quality in [85, 70, 55]) {
    final result = img.encodeJpg(image, quality: quality);
    if (result.length <= 3 * 1024 * 1024) return result;
  }
  throw const FormatException('Choose a smaller label photo.');
}

class ScanOperation {
  ScanOperation(this.image, {String? key}) : key = key ?? randomKey();
  final Uint8List image;
  final String key;
  Future<ProductResult> execute(
    AccountRepository repository, {
    Future<void>? cancellation,
    Duration budget = const Duration(seconds: 90),
  }) async {
    final deadline = DateTime.now().add(budget);
    var transportRetries = 0;
    final payload = 'data:image/jpeg;base64,${base64Encode(image)}';
    // The backend has no stage/progress stream. The UI remains indeterminate.
    for (;;) {
      final remaining = deadline.difference(DateTime.now());
      if (remaining <= Duration.zero) {
        throw const ApiFailure(
          'request_timeout',
          'Analysis is taking longer than expected. Check this scan again without creating another request.',
        );
      }
      try {
        final data = await repository.request(
          'POST',
          '/api/scan',
          body: {'image': payload},
          headers: {'Idempotency-Key': key},
          timeout: remaining > const Duration(seconds: 60)
              ? const Duration(seconds: 60)
              : remaining,
          cancellation: cancellation,
        );
        final result = ProductResult(data);
        if (result.scanId == null || result.scanId!.isEmpty) {
          throw const FormatException('Missing saved scan identifier.');
        }
        return result;
      } on ApiFailure catch (e) {
        final pending = e.status == 409 && e.code == 'scan_in_progress';
        if (!pending && (!e.isTransportFailure || transportRetries++ >= 2)) {
          rethrow;
        }
        if (DateTime.now()
            .add(const Duration(milliseconds: 1500))
            .isAfter(deadline)) {
          rethrow;
        }
        if (cancellation == null) {
          await Future<void>.delayed(const Duration(milliseconds: 1500));
        } else {
          final cancelled = await Future.any([
            Future<bool>.delayed(
              const Duration(milliseconds: 1500),
              () => false,
            ),
            cancellation.then((_) => true),
          ]);
          if (cancelled) {
            throw const ApiFailure(
              'request_cancelled',
              'The request was cancelled.',
            );
          }
        }
      }
    }
  }
}

Future<Uint8List> prepareImage(Uint8List bytes) => compute(prepareLabel, bytes);
