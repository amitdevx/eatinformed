class ApiFailure implements Exception {
  const ApiFailure(this.code, this.message, {this.status, this.requestId});
  final String code;
  final String message;
  final int? status;
  final String? requestId;

  bool get isTransportFailure =>
      code == 'network_unavailable' || code == 'request_timeout';
  @override
  String toString() =>
      requestId == null ? message : '$message (Request: $requestId)';
}
