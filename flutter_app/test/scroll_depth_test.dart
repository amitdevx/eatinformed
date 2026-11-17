import 'package:eatinformed_mobile/design/motion/scroll_depth.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';

void main() {
  Future<ScrollController> mount(
    WidgetTester tester, {
    bool reduced = false,
  }) async {
    final controller = ScrollController();
    addTearDown(controller.dispose);
    await tester.pumpWidget(
      MaterialApp(
        home: MediaQuery(
          data: MediaQueryData(disableAnimations: reduced),
          child: Scaffold(
            body: SizedBox(
              width: 300,
              height: 400,
              child: SingleChildScrollView(
                controller: controller,
                child: const Column(
                  children: [
                    SizedBox(height: 120),
                    ScrollDepth(
                      child: SizedBox(
                        height: 200,
                        width: 300,
                        child: Text('Measured card'),
                      ),
                    ),
                    SizedBox(height: 700),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
    return controller;
  }

  testWidgets(
    'scroll depth follows downward by measured card height and dims without a filter layer',
    (tester) async {
      final controller = await mount(tester);
      controller.jumpTo(156);
      await tester.pump();
      final scope = find.byType(ScrollDepth);
      final transforms = tester
          .widgetList<Transform>(
            find.descendant(of: scope, matching: find.byType(Transform)),
          )
          .toList();
      expect(transforms.first.transform.storage[13], greaterThan(0));
      expect(transforms.first.transform.storage[13], lessThan(36));
      expect(transforms.last.transform.storage[0], lessThan(1));
      expect(
        tester
            .widget<Opacity>(
              find.descendant(of: scope, matching: find.byType(Opacity)),
            )
            .opacity,
        lessThan(1),
      );
      expect(
        find.descendant(of: scope, matching: find.byType(ColorFiltered)),
        findsNothing,
      );
      expect(tester.takeException(), isNull);
    },
  );
  testWidgets(
    'reduced motion keeps card geometry and opacity static while scrolling',
    (tester) async {
      final controller = await mount(tester, reduced: true);
      controller.jumpTo(156);
      await tester.pump();
      expect(
        find.descendant(
          of: find.byType(ScrollDepth),
          matching: find.byType(Transform),
        ),
        findsNothing,
      );
      expect(find.text('Measured card'), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );
}
