import 'package:flutter/scheduler.dart';

/// Opt-in, bounded measurements for profile-mode runs. Not a performance claim.
class FrameMetrics {
  FrameMetrics({this.capacity = 600}) {
    if (capacity < 1) throw ArgumentError.value(capacity, 'capacity');
  }
  final int capacity;
  final List<FrameTiming> _frames = [];
  bool _running = false;
  void _record(List<FrameTiming> frames) {
    _frames.addAll(frames);
    if (_frames.length > capacity) {
      _frames.removeRange(0, _frames.length - capacity);
    }
  }

  void start() {
    if (_running) return;
    _running = true;
    SchedulerBinding.instance.addTimingsCallback(_record);
  }

  void stop() {
    if (!_running) return;
    SchedulerBinding.instance.removeTimingsCallback(_record);
    _running = false;
  }

  Map<String, num> summary({required double refreshRate}) {
    if (refreshRate <= 0) throw ArgumentError.value(refreshRate);
    final budget = 1000000 / refreshRate;
    final build = _frames.map((f) => f.buildDuration.inMicroseconds).toList()
      ..sort();
    final raster = _frames.map((f) => f.rasterDuration.inMicroseconds).toList()
      ..sort();
    num p95(List<int> values) => values.isEmpty
        ? 0
        : values[((values.length * .95).ceil() - 1).clamp(
                0,
                values.length - 1,
              )] /
              1000;
    return {
      'sampleCount': _frames.length,
      'refreshRate': refreshRate,
      'buildP95Ms': p95(build),
      'rasterP95Ms': p95(raster),
      'overBudget': _frames
          .where(
            (f) =>
                f.buildDuration.inMicroseconds > budget ||
                f.rasterDuration.inMicroseconds > budget,
          )
          .length,
    };
  }
}
