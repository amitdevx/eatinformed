import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../app/config.dart';
import 'api_failure.dart';
import 'json_fields.dart';

class ApiClient {
  ApiClient(this.config, {http.Client? client})
    : _client = client ?? http.Client();
  final AppConfig config;
  final http.Client _client;

  Future<Map<String, dynamic>> request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    String? token,
    Map<String, String>? query,
    Map<String, String> headers = const {},
    Duration timeout = const Duration(seconds: 15),
    Future<void>? cancellation,
  }) async {
    // A feature cannot redirect a credential-bearing request to an external host.
    if (!path.startsWith('/api/') ||
        path.contains('..') ||
        path.contains('?') ||
        path.contains('#')) {
      throw ArgumentError('Expected an EatInformed API path.');
    }
    final uri = config.apiOrigin.resolve(path).replace(queryParameters: query);
    final aborted = Completer<void>();
    final outgoing =
        http.AbortableRequest(
            method,
            uri,
            abortTrigger: cancellation == null
                ? aborted.future
                : Future.any([aborted.future, cancellation]),
          )
          ..headers.addAll({
            'Accept': 'application/json',
            ...headers,
            if (body != null) 'Content-Type': 'application/json',
            if (token != null) 'Authorization': 'Bearer $token',
          })
          ..followRedirects = false;
    if (body != null) outgoing.body = jsonEncode(body);
    try {
      final response = await (() async {
        final streamed = await _client.send(outgoing);
        return http.Response.fromStream(streamed);
      })().timeout(timeout);
      Map<String, dynamic> data;
      try {
        data = jsonObject(jsonDecode(response.body));
      } on FormatException {
        throw ApiFailure(
          'invalid_response',
          'The service returned an invalid response.',
          status: response.statusCode,
        );
      }
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw ApiFailure(
          optionalText(data, 'code') ?? 'request_failed',
          optionalText(data, 'error') ?? 'The request could not complete.',
          status: response.statusCode,
          requestId: optionalText(data, 'requestId'),
        );
      }
      return data;
    } on TimeoutException {
      if (!aborted.isCompleted) aborted.complete();
      throw const ApiFailure(
        'request_timeout',
        'The request timed out. Please try again.',
      );
    } on http.RequestAbortedException {
      throw const ApiFailure('request_cancelled', 'The request was cancelled.');
    } on http.ClientException {
      throw const ApiFailure(
        'network_unavailable',
        'Could not connect. Check your connection and try again.',
      );
    }
  }

  void close() => _client.close();
}
