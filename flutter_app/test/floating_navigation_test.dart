import 'package:eatinformed_mobile/design/tokens.dart';
import 'package:eatinformed_mobile/design/widgets/floating_navigation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';

void main() {
  testWidgets(
    'floating navigation selects by tap and drag without opening Scan',
    (tester) async {
      tester.view.physicalSize = const Size(320, 760);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      var selected = 0;
      var scans = 0;
      await tester.pumpWidget(
        MaterialApp(
          theme: EatTheme.light,
          home: Scaffold(
            body: FloatingNavigation(
              selected: selected,
              onSelect: (index) => selected = index,
              onScan: () => scans++,
            ),
          ),
        ),
      );
      final home = tester.getCenter(find.byTooltip('Home'));
      final guide = tester.getCenter(find.byTooltip('Guide'));
      final gesture = await tester.startGesture(home);
      await gesture.moveTo(guide);
      await tester.pump();
      await gesture.up();
      await tester.pumpAndSettle();
      expect(selected, 2);
      expect(scans, 0);
      final scan = tester.getCenter(find.byTooltip('Scan food label'));
      final centerDrag = await tester.startGesture(scan);
      await centerDrag.moveBy(const Offset(70, 0));
      await tester.pump();
      await centerDrag.up();
      await tester.pumpAndSettle();
      expect(scans, 0);
      expect(selected, 2);
      await tester.tap(find.byTooltip('Scan food label'));
      expect(scans, 1);
      expect(tester.takeException(), isNull);
    },
  );
}
