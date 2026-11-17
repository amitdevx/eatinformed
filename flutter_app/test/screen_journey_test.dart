import 'dart:convert';

import 'package:eatinformed_mobile/app/app.dart';
import 'package:eatinformed_mobile/app/config.dart';
import 'package:eatinformed_mobile/core/data/models.dart';
import 'package:eatinformed_mobile/core/data/preferences.dart';
import 'package:eatinformed_mobile/core/network/api_client.dart';
import 'package:eatinformed_mobile/features/auth/auth_controller.dart';
import 'package:eatinformed_mobile/features/auth/auth_repository.dart';
import 'package:eatinformed_mobile/features/library/guide_screen.dart';
import 'package:eatinformed_mobile/features/library/library.dart';
import 'package:eatinformed_mobile/features/results/result_screen.dart';
import 'package:eatinformed_mobile/features/scan/scan_screen.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:material_ui/material_ui.dart';

import 'support.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late FoodLibrary library;
  setUpAll(() async {
    library = await FoodLibrary.load();
  });
  testWidgets(
    'onboarding completes into Home, tabs navigate and scanner excludes floating controls',
    (tester) async {
      tester.view.physicalSize = const Size(320, 760);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      tester.platformDispatcher.textScaleFactorTestValue = 2;
      addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
      final api = ApiClient(
        AppConfig(apiOrigin: Uri.parse('https://api.example.test')),
        client: MockClient(
          (r) async => http.Response(
            jsonEncode(switch (r.url.path) {
              '/api/history' => {'items': <Object>[], 'nextCursor': null},
              '/api/profile' => {'profile': <String, dynamic>{}},
              '/api/scan' => {
                'quota': {'limit': 4, 'remaining': 4, 'windowSeconds': 7200},
              },
              _ => sessionJson(guest: true),
            }),
            200,
          ),
        ),
      );
      final auth = AuthController(AuthRepository(api), MemorySessionStore());
      final prefs = MemoryPreferences();
      addTearDown(() {
        auth.dispose();
        api.close();
      });
      await auth.signIn();
      await tester.pumpWidget(
        EatInformedApp(
          auth: auth,
          preferences: AppPreferences(prefs),
          library: library,
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Your food, informed.'), findsOneWidget);
      for (var i = 0; i < 2; i++) {
        await tester.ensureVisible(find.text('Continue'));
        await tester.pumpAndSettle();
        await tester.tap(find.text('Continue'));
        await tester.pumpAndSettle();
      }
      await tester.ensureVisible(find.text('Get Started'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Get Started'));
      await tester.pumpAndSettle();
      expect(prefs.values['onboarding:firebase-test-uid'], 'true');
      await tester.tap(find.byTooltip('History'));
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.text('No Saved Scans Yet'));
      await tester.pumpAndSettle();
      expect(find.text('No Saved Scans Yet').hitTestable(), findsOneWidget);
      await tester.tap(find.byTooltip('Guide'));
      await tester.pumpAndSettle();
      expect(find.byType(GuideScreen), findsOneWidget);
      await tester.tap(find.byTooltip('Profile'));
      await tester.pumpAndSettle();
      expect(find.byTooltip('Settings').hitTestable(), findsOneWidget);
      await tester.tap(find.byTooltip('Scan food label'));
      await tester.pumpAndSettle();
      expect(find.byType(ScanScreen), findsOneWidget);
      expect(find.byTooltip('Scan food label').hitTestable(), findsNothing);
      expect(find.text('Gallery').hitTestable(), findsOneWidget);
      await tester.pageBack();
      await tester.pumpAndSettle();
      expect(find.byTooltip('Scan food label').hitTestable(), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );
  testWidgets(
    'guide search and ingredient details remain usable at narrow width and 200 percent text',
    (tester) async {
      tester.view.physicalSize = const Size(320, 760);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      tester.platformDispatcher.textScaleFactorTestValue = 2;
      addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: GuideScreen(library: library)),
        ),
      );
      await tester.pumpAndSettle();
      final additives = find.text('Additive Dictionary (22)');
      await tester.ensureVisible(additives);
      await tester.pumpAndSettle();
      await tester.tap(additives);
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextField), 'E407');
      await tester.pumpAndSettle();
      expect(find.text('1 reference entries found'), findsOneWidget);
      tester.testTextInput.hide();
      await tester.pumpAndSettle();
      final entry = find.text('Carrageenan');
      await tester.ensureVisible(entry);
      await tester.pumpAndSettle();
      await tester.tap(entry);
      await tester.pumpAndSettle();
      expect(find.text('COMMON SOURCES'), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      await tester.pump();
    },
  );
  testWidgets(
    'report preserves unknown estimates and nutrition bases with large text',
    (tester) async {
      tester.view.physicalSize = const Size(320, 760);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      tester.platformDispatcher.textScaleFactorTestValue = 2;
      addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
      final result = ProductResult({
        'status': 'success',
        'productName': 'A very long product label with incomplete evidence',
        'rating': null,
        'novaGroup': null,
        'ingredients': ['Milk powder'],
        'dietaryInfo': {'isVegan': null},
        'nutrition': {
          'servingSizeLabel': '30 g',
          'nutrients': [
            {'nutrient': 'Protein', 'perServing': '4 g', 'per100g': '13.3 g'},
          ],
        },
      });
      await tester.pumpWidget(
        MaterialApp(
          home: ResultScreen(
            result: result,
            library: library,
            allergens: const ['milk'],
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Your allergen flags'), findsOneWidget);
      expect(find.text('Rating unavailable'), findsOneWidget);
      await tester.ensureVisible(find.text('Nutrition Facts'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Nutrition Facts'));
      await tester.pumpAndSettle();
      expect(find.textContaining('4 g'), findsWidgets);
      expect(tester.takeException(), isNull);
    },
  );
  testWidgets(
    'report offers both existing share formats and dismisses without native side effects',
    (tester) async {
      final report = ProductResult({
        'status': 'success',
        'productName': 'Label',
        'rating': null,
        'novaGroup': null,
      });
      await tester.pumpWidget(
        MaterialApp(
          home: ResultScreen(result: report, library: library),
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byTooltip('Share report'));
      await tester.pumpAndSettle();
      expect(find.text('Share as Text Summary').hitTestable(), findsOneWidget);
      expect(find.text('Share as JSON File').hitTestable(), findsOneWidget);
      await tester.binding.handlePopRoute();
      await tester.pumpAndSettle();
      expect(find.text('Share Product Report'), findsNothing);
      expect(tester.takeException(), isNull);
    },
  );
}
