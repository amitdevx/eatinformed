import 'package:eatinformed_mobile/app/config.dart';
import 'package:eatinformed_mobile/core/data/account_repository.dart';
import 'package:eatinformed_mobile/core/data/account_state.dart';
import 'package:eatinformed_mobile/core/data/preferences.dart';
import 'package:eatinformed_mobile/core/network/api_client.dart';
import 'package:eatinformed_mobile/core/session/session.dart';
import 'package:eatinformed_mobile/features/auth/auth_controller.dart';
import 'package:eatinformed_mobile/features/auth/auth_repository.dart';
import 'package:eatinformed_mobile/features/profile/profile_screen.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';
import 'package:http/testing.dart';
import 'package:http/http.dart' as http;

import 'support.dart';

import 'package:eatinformed_mobile/features/profile/pull_physics.dart';
import 'package:eatinformed_mobile/features/profile/edit_profile.dart';

void main() {
  Future<List<bool>> mount(WidgetTester tester, {bool reduced = false}) async {
    tester.view.physicalSize = const Size(400, 850);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final api = ApiClient(
      AppConfig(apiOrigin: Uri.parse('https://api.example.test')),
      client: MockClient((_) async => http.Response('{}', 503)),
    );
    final auth = AuthController(AuthRepository(api), MemorySessionStore());
    final data = AccountState(AccountRepository(auth, MemoryPreferences()))
      ..records = [];
    final changes = <bool>[];
    addTearDown(() {
      data.dispose();
      auth.dispose();
      api.close();
    });
    await tester.pumpWidget(
      MaterialApp(
        home: MediaQuery(
          data: MediaQueryData(
            size: const Size(400, 850),
            disableAnimations: reduced,
          ),
          child: Scaffold(
            body: ProfileScreen(
              session: AccountSession.fromJson(sessionJson()),
              data: data,
              preferences: AppPreferences(MemoryPreferences()),
              onEdit: () {},
              onSettings: () {},
              onHistory: () {},
              onOpen: (_) {},
              onUpgrade: () {},
              onReveal: changes.add,
            ),
          ),
        ),
      ),
    );
    await tester.pump(const Duration(seconds: 1));
    return changes;
  }

  Future<void> stop(WidgetTester tester) async {
    await tester.pumpWidget(const SizedBox());
    await tester.pump();
    expect(tester.takeException(), isNull);
  }

  testWidgets(
    'one intentional pull opens Passport and closing allows another pull',
    (tester) async {
      final changes = await mount(tester);
      final close = find.byTooltip('Close Food Passport');
      expect(close.hitTestable(), findsNothing);
      for (var i = 0; i < 2; i++) {
        final gesture = await tester.startGesture(const Offset(180, 120));
        await gesture.moveBy(const Offset(0, 380));
        await tester.pump();
        await gesture.up();
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 500));
        expect(close.hitTestable(), findsOneWidget);
        expect(changes.last, true);
        expect(find.text('0 saved scans').hitTestable(), findsOneWidget);
        await tester.tap(close);
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 400));
        expect(close.hitTestable(), findsNothing);
        expect(changes.last, false);
      }
      await stop(tester);
    },
  );
  testWidgets(
    'short pull, horizontal intent and pointer cancellation do not open Passport',
    (tester) async {
      await mount(tester);
      final close = find.byTooltip('Close Food Passport');
      for (final delta in [const Offset(0, 70), const Offset(160, 30)]) {
        await tester.dragFrom(const Offset(180, 120), delta);
        await tester.pump(const Duration(milliseconds: 450));
        expect(close.hitTestable(), findsNothing);
      }
      final g = await tester.startGesture(const Offset(180, 120));
      await g.moveBy(const Offset(0, 380));
      await tester.pump();
      await g.cancel();
      await tester.pump(const Duration(milliseconds: 450));
      expect(close.hitTestable(), findsNothing);
      await stop(tester);
    },
  );
  testWidgets(
    'pull away from scroll top keeps normal scrolling and does not reveal',
    (tester) async {
      final changes = await mount(tester);
      await tester.dragFrom(const Offset(180, 600), const Offset(0, -380));
      await tester.pump(const Duration(milliseconds: 400));
      await tester.dragFrom(const Offset(180, 200), const Offset(0, 150));
      await tester.pump(const Duration(milliseconds: 400));
      expect(find.byTooltip('Close Food Passport').hitTestable(), findsNothing);
      expect(changes.where((v) => v), isEmpty);
      await stop(tester);
    },
  );
  testWidgets(
    'reduced motion opens and closes immediately and Android Back dismisses',
    (tester) async {
      await mount(tester, reduced: true);
      final open = find.text('Passport');
      await tester.ensureVisible(open);
      await tester.tap(open);
      await tester.pump();
      expect(
        find.byTooltip('Close Food Passport').hitTestable(),
        findsOneWidget,
      );
      await tester.binding.handlePopRoute();
      await tester.pump();
      expect(find.byTooltip('Close Food Passport').hitTestable(), findsNothing);
      await stop(tester);
    },
  );
  test('accumulated pull damps downward movement and reverses at 0.8', () {
    expect(PullPhysics.progress(0), 0);
    expect(PullPhysics.progress(PullPhysics.advance(0, 400)), 1);
    expect(PullPhysics.progress(PullPhysics.advance(0, 180)), lessThan(1));
    expect(
      PullPhysics.advance(150, 50) - 150,
      lessThan(PullPhysics.advance(0, 50)),
    );
    expect(PullPhysics.advance(100, -50), 60);
  });
  test('suggested handles preserve chosen input constraints', () {
    for (final email in [
      'a@x.test',
      'A+B.C@x.test',
      'long_email_with_many_letters@example.test',
    ]) {
      expect(suggestedHandle(email), matches(RegExp(r'^[a-z0-9_]{3,20}$')));
    }
  });
}
