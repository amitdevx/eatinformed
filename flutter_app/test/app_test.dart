import 'dart:convert';

import 'package:material_ui/material_ui.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:eatinformed_mobile/app/app.dart';
import 'package:eatinformed_mobile/app/config.dart';
import 'package:eatinformed_mobile/core/network/api_client.dart';
import 'package:eatinformed_mobile/design/motion/entrance.dart';
import 'package:eatinformed_mobile/design/tokens.dart';
import 'package:eatinformed_mobile/features/auth/auth_controller.dart';
import 'package:eatinformed_mobile/features/auth/auth_repository.dart';

import 'support.dart';

void main() {
  testWidgets('guest entry changes navigation and logout clears account UI', (
    tester,
  ) async {
    final api = ApiClient(
      AppConfig(apiOrigin: Uri.parse('https://api.example.test')),
      client: MockClient(
        (_) async => http.Response(jsonEncode(sessionJson(guest: true)), 200),
      ),
    );
    final auth = AuthController(AuthRepository(api), MemorySessionStore());
    addTearDown(() {
      auth.dispose();
      api.close();
    });
    await auth.restore();
    await tester.pumpWidget(EatInformedApp(auth: auth));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Continue as guest'));
    await tester.pumpAndSettle();
    expect(find.text('Test Reader'), findsOneWidget);
    expect(find.text('Continue as guest'), findsNothing);
    await tester.tap(find.text('Sign out'));
    await tester.pumpAndSettle();
    expect(find.text('Test Reader'), findsNothing);
    expect(find.text('Continue as guest'), findsOneWidget);
  });
  testWidgets('welcome tolerates narrow viewport and 200 percent text', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 720);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final api = ApiClient(
      AppConfig(apiOrigin: Uri.parse('https://api.example.test')),
      client: MockClient((_) async => http.Response('{}', 503)),
    );
    final auth = AuthController(AuthRepository(api), MemorySessionStore());
    addTearDown(() {
      auth.dispose();
      api.close();
    });
    await auth.restore();
    tester.platformDispatcher.textScaleFactorTestValue = 2;
    addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
    await tester.pumpWidget(EatInformedApp(auth: auth));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });
  testWidgets('reduced motion settles entrance immediately', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: MediaQuery(
          data: const MediaQueryData(disableAnimations: true),
          child: const Entrance(child: Text('Readable immediately')),
        ),
      ),
    );
    expect(tester.widget<Opacity>(find.byType(Opacity).last).opacity, 1);
    expect(tester.binding.transientCallbackCount, 0);
  });
  testWidgets(
    'account appearance control switches to dark without changing identity',
    (tester) async {
      final api = ApiClient(
        AppConfig(apiOrigin: Uri.parse('https://api.example.test')),
        client: MockClient(
          (_) async => http.Response(jsonEncode(sessionJson()), 200),
        ),
      );
      final auth = AuthController(AuthRepository(api), MemorySessionStore());
      addTearDown(() {
        auth.dispose();
        api.close();
      });
      await auth.restore();
      await auth.signIn(
        email: 'reader@example.test',
        password: 'test-password',
      );
      await tester.pumpWidget(EatInformedApp(auth: auth));
      await tester.pumpAndSettle();
      await tester.tap(find.byType(DropdownButtonFormField<ThemeMode>));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Dark').last);
      await tester.pumpAndSettle();
      final context = tester.element(find.text('Test Reader'));
      expect(Theme.of(context).brightness, Brightness.dark);
      expect(Theme.of(context).scaffoldBackgroundColor, Colors.black);
      expect(auth.session?.uid, 'firebase-test-uid');
    },
  );
  test('dark theme has an AMOLED scaffold and readable primary text', () {
    expect(EatTheme.dark.scaffoldBackgroundColor, Colors.black);
    expect(EatTheme.dark.colorScheme.onSurface, Colors.white);
  });
}
