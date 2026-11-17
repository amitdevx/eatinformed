/// Profile pull state, expressed in displayed logical pixels.
/// Pointer deltas are accumulated so reversing a drag undoes the visible pull.
abstract final class PullPhysics {
  static const reach = 210.0;
  static const maximum = reach * 1.3;

  static double advance(double current, double delta) {
    final resistance = delta < 0
        ? .8
        : .66 * (1 - (current / (reach * 1.45)).clamp(0.0, .88));
    return (current + delta * resistance).clamp(0.0, maximum);
  }

  static double progress(double displacement) =>
      (displacement / reach).clamp(0.0, 1.0);
}
