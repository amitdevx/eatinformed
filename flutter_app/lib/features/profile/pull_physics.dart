import 'dart:math' as math;

/// Independent resistance curve; distance decreases continuously with reach.
/// The activation threshold is measured after resistance, not raw travel.
abstract final class PullPhysics {
  static const reach = 210.0;
  static double displacement(double travel) =>
      180 * (math.sqrt(1 + 2 * math.max(0, travel) / 180) - 1);
  static double progress(double travel) =>
      (displacement(travel) / reach).clamp(0, 1);
}
