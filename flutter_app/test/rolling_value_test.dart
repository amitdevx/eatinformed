import 'package:eatinformed_mobile/design/motion/rolling_value.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';

void main() {
  testWidgets(
    'value transitions remain interruptible and reduced motion settles',
    (tester) async {
      Future<void> show(String value, {bool reduced = false}) =>
          tester.pumpWidget(
            MaterialApp(
              home: MediaQuery(
                data: MediaQueryData(disableAnimations: reduced),
                child: RollingValue(value),
              ),
            ),
          );
      await show('2.1 / 5');
      await show('3.4 / 5');
      await tester.pump(const Duration(milliseconds: 120));
      await show('Unknown');
      await tester.pumpAndSettle();
      expect(find.text('Unknown'), findsOneWidget);
      expect(find.text('3.4 / 5'), findsNothing);
      await show('4.5 / 5', reduced: true);
      await tester.pumpAndSettle();
      expect(find.text('Unknown'), findsNothing);
      expect(find.text('4.5 / 5'), findsOneWidget);
      expect(tester.binding.transientCallbackCount, 0);
    },
  );
}
