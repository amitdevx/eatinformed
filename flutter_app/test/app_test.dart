import 'dart:async';
import 'dart:convert';

import 'package:material_ui/material_ui.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:eatinformed_mobile/app/app.dart';
import 'package:eatinformed_mobile/app/config.dart';
import 'package:eatinformed_mobile/core/network/api_client.dart';
import 'package:eatinformed_mobile/design/motion/entrance.dart';
import 'package:eatinformed_mobile/design/tokens.dart';
import 'package:eatinformed_mobile/features/auth/auth_controller.dart';
import 'package:eatinformed_mobile/features/auth/auth_repository.dart';
import 'package:eatinformed_mobile/features/auth/sign_in_screen.dart';

import 'support.dart';

import 'package:eatinformed_mobile/features/library/library.dart';

import 'package:eatinformed_mobile/core/data/preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late FoodLibrary library;
  setUpAll(() async {
    library = await FoodLibrary.load();
    PackageInfo.setMockInitialValues(
      appName: 'EatInformed',
      packageName: 'com.eatinformed.preview.eatinformed_mobile',
      version: '0.1.0',
      buildNumber: '42',
      buildSignature: '',
    );
  });
  testWidgets('guest entry changes navigation and logout clears account UI', (
    tester,
  ) async {
    final api = ApiClient(
      AppConfig(apiOrigin: Uri.parse('https://api.example.test')),
      client: MockClient(
        (r) async => http.Response(
          jsonEncode(
            r.url.path == '/api/history'
                ? {'items': <Object>[], 'nextCursor': null}
                : r.url.path == '/api/profile'
                ? {'profile': <String, dynamic>{}}
                : sessionJson(guest: true),
          ),
          200,
        ),
      ),
    );
    final auth = AuthController(AuthRepository(api), MemorySessionStore());
    addTearDown(() {
      auth.dispose();
      api.close();
    });
    await auth.restore();
    final prefs = MemoryPreferences();
    await prefs.write('onboarding:firebase-test-uid', 'true');
    await tester.pumpWidget(
      EatInformedApp(
        auth: auth,
        preferences: AppPreferences(prefs),
        library: library,
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Continue as guest'));
    await tester.pumpAndSettle();
    expect(find.text('EatInformed'), findsWidgets);
    expect(find.text('Continue as guest'), findsNothing);
    await tester.tap(find.byTooltip('Profile'));
    await tester.pumpAndSettle();
    expect(find.text('Test Reader'), findsWidgets);
    await tester.tap(find.text('Passport'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));
    expect(find.text('FOOD PASSPORT'), findsOneWidget);
    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();
    expect(find.byTooltip('Settings').hitTestable(), findsOneWidget);
    expect(find.text('Test Reader'), findsWidgets);
    await tester.tap(find.byTooltip('Settings'));
    await tester.pumpAndSettle();
    expect(find.text('Allergen preferences'), findsOneWidget);
    expect(find.text('Additive dictionary'), findsOneWidget);
    expect(find.text('Strict Allergen Alerts'), findsNothing);
    expect(find.text('Offline Additive Protection'), findsNothing);
    expect(find.text('EatInformed 0.1.0 (42)'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.text('Exit Guest Mode'),
      250,
      scrollable: find.byType(Scrollable).last,
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Exit Guest Mode'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 350));
    await tester.tap(find.text('Confirm'));
    await tester.pumpAndSettle();
    expect(find.text('Test Reader'), findsNothing);
    expect(find.text('Continue as guest'), findsOneWidget);
  });
  testWidgets(
    'guest authentication shows its action and blocks duplicate taps',
    (tester) async {
      final pending = Completer<http.Response>();
      var requests = 0;
      final api = ApiClient(
        AppConfig(apiOrigin: Uri.parse('https://api.example.test')),
        client: MockClient((_) {
          requests++;
          return pending.future;
        }),
      );
      final auth = AuthController(AuthRepository(api), MemorySessionStore());
      addTearDown(() {
        auth.dispose();
        api.close();
      });
      await auth.restore();
      await tester.pumpWidget(MaterialApp(home: SignInScreen(auth: auth)));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Continue as guest'));
      await tester.pump();
      expect(find.text('Starting guest session...'), findsOneWidget);
      expect(requests, 1);
      final button = tester.widget<OutlinedButton>(
        find.ancestor(
          of: find.text('Starting guest session...'),
          matching: find.byType(OutlinedButton),
        ),
      );
      expect(button.onPressed, isNull);
      pending.complete(
        http.Response(jsonEncode(sessionJson(guest: true)), 200),
      );
      await tester.pumpAndSettle();
      expect(auth.session?.isGuest, isTrue);
      expect(requests, 1);
    },
  );
  testWidgets('guest onboarding uses profile, avatar, and review steps', (
    tester,
  ) async {
    final api = ApiClient(
      AppConfig(apiOrigin: Uri.parse('https://api.example.test')),
      client: MockClient(
        (r) async => http.Response(
          jsonEncode(
            r.url.path == '/api/history'
                ? {'items': <Object>[], 'nextCursor': null}
                : r.url.path == '/api/profile'
                ? {'profile': <String, dynamic>{}}
                : sessionJson(guest: true),
          ),
          200,
        ),
      ),
    );
    final auth = AuthController(AuthRepository(api), MemorySessionStore());
    addTearDown(() {
      auth.dispose();
      api.close();
    });
    await auth.restore();
    await tester.pumpWidget(
      EatInformedApp(
        auth: auth,
        preferences: AppPreferences(MemoryPreferences()),
        library: library,
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Continue as guest'));
    await tester.pumpAndSettle();
    expect(find.text('What should we call you?'), findsOneWidget);
    expect(find.text('NOVA Classification'), findsNothing);
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    expect(find.text('Choose your avatar'), findsOneWidget);
    expect(
      find.text('Create an account to choose a profile photo.'),
      findsOneWidget,
    );
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    expect(find.text('You are ready to explore'), findsOneWidget);
    expect(
      find.text(
        'Food ratings are AI estimates. Check the original label, especially for allergens.',
      ),
      findsOneWidget,
    );
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
    await tester.pumpWidget(EatInformedApp(auth: auth, library: library));
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
          (r) async => http.Response(
            jsonEncode(
              r.url.path == '/api/history'
                  ? {'items': <Object>[], 'nextCursor': null}
                  : r.url.path == '/api/profile'
                  ? {'profile': <String, dynamic>{}}
                  : sessionJson(),
            ),
            200,
          ),
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
      final prefs = MemoryPreferences();
      await prefs.write('onboarding:firebase-test-uid', 'true');
      await tester.pumpWidget(
        EatInformedApp(
          auth: auth,
          preferences: AppPreferences(prefs),
          library: library,
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byTooltip('Profile'));
      await tester.pumpAndSettle();
      await tester.tap(find.byTooltip('Settings'));
      await tester.pumpAndSettle();
      expect(find.text('Sign Out of EatInformed'), findsOneWidget);
      await tester.tap(find.text('Interface Theme'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Dark').last);
      await tester.pumpAndSettle();
      final context = tester.element(find.text('Settings').first);
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
