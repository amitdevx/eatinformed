import 'package:material_ui/material_ui.dart';

import '../tokens.dart';

class ContentFrame extends StatelessWidget {
  const ContentFrame({super.key, required this.slivers});
  final List<Widget> slivers;
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
              padding: const EdgeInsets.all(LayoutTokens.pagePadding),
              sliver: SliverMainAxisGroup(slivers: slivers),
            ),
          ],
        ),
      ),
    ),
  );
}
