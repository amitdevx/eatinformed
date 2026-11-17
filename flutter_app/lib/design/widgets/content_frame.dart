import 'package:material_ui/material_ui.dart';

import '../tokens.dart';

class ContentFrame extends StatelessWidget {
  const ContentFrame({
    super.key,
    required this.slivers,
    this.bottomOverlayClearance = 0,
  });
  final List<Widget> slivers;
  final double bottomOverlayClearance;
  @override
  Widget build(BuildContext context) => SafeArea(
    child: Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(
          maxWidth: LayoutTokens.maxContentWidth,
        ),
        child: CustomScrollView(
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          slivers: [
            SliverPadding(
              padding: EdgeInsets.fromLTRB(
                LayoutTokens.pagePadding,
                LayoutTokens.pagePadding,
                LayoutTokens.pagePadding,
                LayoutTokens.pagePadding + bottomOverlayClearance,
              ),
              sliver: SliverMainAxisGroup(slivers: slivers),
            ),
          ],
        ),
      ),
    ),
  );
}
