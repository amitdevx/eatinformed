class AppConfig {
  AppConfig({required this.apiOrigin}) {
    if (apiOrigin.scheme != 'https' ||
        apiOrigin.host.isEmpty ||
        apiOrigin.userInfo.isNotEmpty ||
        apiOrigin.hasQuery ||
        apiOrigin.hasFragment ||
        (apiOrigin.path.isNotEmpty && apiOrigin.path != '/')) {
      throw ArgumentError(
        'API origin must be an HTTPS origin without credentials or a path.',
      );
    }
  }

  factory AppConfig.environment() => AppConfig(
    apiOrigin: Uri.parse(
      const String.fromEnvironment(
        'EATINFORMED_API_ORIGIN',
        defaultValue: 'https://eatinformed.amitdevx.tech',
      ),
    ),
  );

  final Uri apiOrigin;
}
