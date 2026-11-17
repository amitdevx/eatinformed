import 'package:eatinformed_mobile/features/home/home_visuals.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';

void main() {
  testWidgets('rating visuals keep missing scores unknown', (tester) async {
    final start = DateTime(2026, 11, 11);
    final days = [
      for (var i = 0; i < 7; i++) RatingDay(start.add(Duration(days: i)), null),
    ];
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Column(
            children: [
              const RatingRing(null),
              SevenDayTrend(days: days, haptics: false),
            ],
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('—'), findsOneWidget);
    expect(find.text('No Scans in Last 7 Days'), findsOneWidget);
    expect(find.textContaining('2.5'), findsNothing);
    expect(tester.takeException(), isNull);
  });

  testWidgets('trend scrub reports only recorded daily ratings', (
    tester,
  ) async {
    final start = DateTime(2026, 11, 11);
    final days = [
      for (var i = 0; i < 7; i++)
        RatingDay(
          start.add(Duration(days: i)),
          i == 1
              ? 4.2
              : i == 5
              ? 3.1
              : null,
        ),
    ];
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            width: 320,
            child: SevenDayTrend(days: days, haptics: false),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('11/16  3.1 / 5'), findsOneWidget);
    await tester.tapAt(const Offset(60, 90));
    await tester.pump();
    expect(find.text('11/12  4.2 / 5'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
