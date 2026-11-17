import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:eatinformed_mobile/design/motion/name_ticker.dart';

Widget scene({
  bool running = true,
  bool reduced = false,
  bool enabled = true,
}) => MediaQuery(
  data: MediaQueryData(disableAnimations: reduced),
  child: Directionality(
    textDirection: TextDirection.ltr,
    child: TickerMode(
      enabled: enabled,
      child: SizedBox(
        width: 360,
        height: 640,
        child: NameTicker(
          text: 'Label Reader',
          color: const Color(0x18FFFFFF),
          running: running,
        ),
      ),
    ),
  ),
);

void main() {
  testWidgets(
    'hidden and reduced-motion tickers do not schedule animation frames',
    (tester) async {
      for (final widget in [
        scene(running: false),
        scene(reduced: true),
        scene(enabled: false),
      ]) {
        await tester.pumpWidget(widget);
        expect(tester.binding.transientCallbackCount, 0);
      }
    },
  );
  testWidgets(
    'ticker stops in background, resumes and disposes without callbacks',
    (tester) async {
      await tester.pumpWidget(scene());
      await tester.pump(const Duration(milliseconds: 100));
      expect(tester.binding.transientCallbackCount, greaterThan(0));
      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.paused);
      expect(tester.binding.transientCallbackCount, 0);
      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
      await tester.pump(const Duration(milliseconds: 16));
      expect(tester.binding.transientCallbackCount, greaterThan(0));
      await tester.pumpWidget(const SizedBox.shrink());
      expect(tester.binding.transientCallbackCount, 0);
      expect(tester.takeException(), isNull);
    },
  );
}
