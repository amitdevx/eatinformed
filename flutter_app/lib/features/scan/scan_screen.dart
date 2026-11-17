import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:camera/camera.dart';
import 'package:image_picker/image_picker.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/data/account_repository.dart';
import '../../core/data/models.dart';
import '../../core/network/api_failure.dart';
import '../../design/widgets/surfaces.dart';
import 'scan_service.dart';

class _ViewfinderCorners extends CustomPainter {
  const _ViewfinderCorners(this.color);
  final Color color;
  @override
  void paint(Canvas canvas, Size size) {
    final stroke = Paint()
      ..color = color
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    const reach = 27.0, radius = 14.0;
    final path = Path()
      ..moveTo(0, reach)
      ..lineTo(0, radius)
      ..quadraticBezierTo(0, 0, radius, 0)
      ..lineTo(reach, 0)
      ..moveTo(size.width - reach, 0)
      ..lineTo(size.width - radius, 0)
      ..quadraticBezierTo(size.width, 0, size.width, radius)
      ..lineTo(size.width, reach)
      ..moveTo(size.width, size.height - reach)
      ..lineTo(size.width, size.height - radius)
      ..quadraticBezierTo(
        size.width,
        size.height,
        size.width - radius,
        size.height,
      )
      ..lineTo(size.width - reach, size.height)
      ..moveTo(reach, size.height)
      ..lineTo(radius, size.height)
      ..quadraticBezierTo(0, size.height, 0, size.height - radius)
      ..lineTo(0, size.height - reach);
    canvas.drawPath(path, stroke);
  }

  @override
  bool shouldRepaint(_ViewfinderCorners oldDelegate) =>
      oldDelegate.color != color;
}

class ScanScreen extends StatefulWidget {
  const ScanScreen({super.key, required this.repository});
  final AccountRepository repository;
  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> with WidgetsBindingObserver {
  CameraController? _camera;
  List<CameraDescription> _cameras = [];
  int _cameraIndex = 0, _generation = 0;
  ScanOperation? _operation;
  Uint8List? _image;
  String? _error;
  bool _busy = false, _preparing = false, _starting = false;
  Completer<void>? _cancellation;
  Quota? _quota;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _lostImage();
    _loadQuota();
  }

  Future<void> _loadQuota() async {
    try {
      final q = await widget.repository.quota();
      if (mounted) setState(() => _quota = q);
    } catch (_) {}
  }

  Future<void> _lostImage() async {
    if (!Platform.isAndroid) return;
    try {
      final data = await ImagePicker().retrieveLostData();
      if (data.files?.isNotEmpty == true) await _choose(data.files!.first);
    } catch (_) {
      if (mounted) {
        setState(
          () => _error =
              'Could not restore the selected photo. Please choose it again.',
        );
      }
    }
  }

  Future<void> _stopCamera() async {
    ++_generation;
    final old = _camera;
    _camera = null;
    await old?.dispose();
  }

  Future<void> _startCamera() async {
    if (_starting || _busy || _image != null) return;
    _starting = true;
    final generation = ++_generation;
    setState(() => _error = null);
    CameraController? next;
    try {
      _cameras = await availableCameras();
      if (_cameras.isEmpty) {
        throw CameraException(
          'unavailable',
          'No camera is available. Choose a gallery photo.',
        );
      }
      next = CameraController(
        _cameras[_cameraIndex % _cameras.length],
        ResolutionPreset.high,
        enableAudio: false,
      );
      await next.initialize();
      if (!mounted || generation != _generation) {
        await next.dispose();
        return;
      }
      _camera = next;
    } catch (e) {
      await next?.dispose();
      if (mounted && generation == _generation) {
        _error = e is CameraException
            ? 'Camera unavailable. Check camera permission or choose a gallery photo.'
            : 'Could not start the camera.';
      }
    } finally {
      _starting = false;
      if (mounted) setState(() {});
    }
  }

  Future<void> _choose(XFile file) async {
    await _stopCamera();
    if (!mounted) return;
    setState(() {
      _preparing = true;
      _error = null;
    });
    try {
      final bytes = await prepareImage(await file.readAsBytes());
      if (mounted) {
        setState(() {
          _image = bytes;
          _operation = ScanOperation(bytes);
        });
      }
    } catch (e) {
      if (mounted) {
        setState(
          () => _error = e is FormatException
              ? e.message
              : 'Could not prepare this photo. Please choose another image.',
        );
      }
    } finally {
      if (mounted) setState(() => _preparing = false);
    }
  }

  Future<void> _gallery() async {
    if (_busy || _preparing) return;
    try {
      await _stopCamera();
      final file = await ImagePicker().pickImage(
        source: ImageSource.gallery,
        maxWidth: 1800,
        maxHeight: 1800,
        imageQuality: 95,
        requestFullMetadata: false,
      );
      if (file != null) {
        await _choose(file);
      } else if (mounted) {
        setState(() {});
      }
    } catch (_) {
      if (mounted) setState(() => _error = 'Could not access photo library.');
    }
  }

  Future<void> _capture() async {
    final camera = _camera;
    if (camera == null ||
        !camera.value.isInitialized ||
        camera.value.isTakingPicture) {
      return;
    }
    try {
      final file = await camera.takePicture();
      await _choose(file);
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'Could not capture photo. Please try again.');
      }
    }
  }

  Future<void> _analyze() async {
    if (_operation == null || _busy) return;
    final cancellation = Completer<void>();
    _cancellation = cancellation;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final result = await _operation!.execute(
        widget.repository,
        cancellation: cancellation.future,
      );
      if (mounted) Navigator.pop(context, result);
    } catch (e) {
      if (mounted) {
        setState(
          () => _error = e is ApiFailure
              ? e.toString()
              : e is FormatException
              ? e.message
              : 'Analysis could not complete. Please try again.',
        );
      }
    } finally {
      if (identical(_cancellation, cancellation)) _cancellation = null;
      if (mounted) setState(() => _busy = false);
      _loadQuota();
    }
  }

  void _cancel() {
    if (_cancellation?.isCompleted == false) _cancellation!.complete();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state != AppLifecycleState.resumed) {
      _stopCamera();
      _cancel();
    } else if (mounted) {
      setState(() {});
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _cancel();
    _stopCamera();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: !_busy,
    onPopInvokedWithResult: (didPop, result) {
      if (!didPop) _cancel();
    },
    child: Scaffold(
      appBar: AppBar(
        title: const Text('Scan Food Label'),
        actions: [
          if (_camera != null)
            IconButton(
              tooltip: 'Switch camera',
              onPressed: () async {
                await _stopCamera();
                _cameraIndex++;
                if (mounted) await _startCamera();
              },
              icon: const Icon(Icons.cameraswitch_outlined),
            ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (_quota != null)
              Padding(
                padding: const EdgeInsets.all(12),
                child: Text(
                  '${_quota!.remaining} of ${_quota!.limit} scans remaining${_quota!.nextAvailableAt == null ? '' : ' • Available ${MaterialLocalizations.of(context).formatTimeOfDay(TimeOfDay.fromDateTime(_quota!.nextAvailableAt!.toLocal()))}'}',
                ),
              ),
            Expanded(
              child: _busy
                  ? Center(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const CircularProgressIndicator(
                              semanticsLabel: 'Waiting for food analysis',
                            ),
                            const SizedBox(height: 24),
                            Text(
                              'Analyzing Food Product',
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'Sending your photo and waiting for the analysis service. You can cancel waiting; accepted work may still complete and appear in History.',
                            ),
                            const SizedBox(height: 24),
                            OutlinedButton(
                              onPressed: _cancel,
                              child: const Text('Cancel waiting'),
                            ),
                          ],
                        ),
                      ),
                    )
                  : _preparing
                  ? const Center(
                      child: CircularProgressIndicator(
                        semanticsLabel: 'Preparing image',
                      ),
                    )
                  : _image != null
                  ? Padding(
                      padding: const EdgeInsets.all(16),
                      child: Image.memory(_image!, fit: BoxFit.contain),
                    )
                  : _camera?.value.isInitialized == true
                  ? Stack(
                      fit: StackFit.expand,
                      children: [
                        Center(child: CameraPreview(_camera!)),
                        IgnorePointer(
                          child: Center(
                            child: LayoutBuilder(
                              builder: (context, limits) {
                                final width = (limits.maxWidth * .8).clamp(
                                  0.0,
                                  340.0,
                                );
                                final height = (limits.maxHeight * .58).clamp(
                                  0.0,
                                  440.0,
                                );
                                return SizedBox(
                                  width: width,
                                  height: height,
                                  child: CustomPaint(
                                    painter: _ViewfinderCorners(
                                      Theme.of(context).colorScheme.primary,
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        ),
                      ],
                    )
                  : Center(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.document_scanner_outlined,
                              size: 64,
                            ),
                            const SizedBox(height: 20),
                            const Text(
                              'Align the food ingredient label or nutrition panel. The entire photo is analyzed.',
                            ),
                            const SizedBox(height: 20),
                            FilledButton(
                              onPressed: _starting ? null : _startCamera,
                              child: Text(
                                _starting ? 'Opening camera' : 'Enable camera',
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
            ),
            if (_error != null)
              Flexible(
                child: SingleChildScrollView(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Notice(_error!),
                  ),
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Wrap(
                alignment: WrapAlignment.center,
                spacing: 16,
                runSpacing: 12,
                children: [
                  OutlinedButton.icon(
                    onPressed: _busy || _preparing ? null : _gallery,
                    icon: const Icon(Icons.photo_library_outlined),
                    label: const Text('Gallery'),
                  ),
                  if (_image != null) ...[
                    FilledButton(
                      onPressed: _busy || _preparing ? null : _analyze,
                      child: Text(
                        _error == null
                            ? 'Analyze Food Label'
                            : 'Check scan again',
                      ),
                    ),
                    TextButton(
                      onPressed: _busy
                          ? null
                          : () {
                              setState(() {
                                _image = null;
                                _operation = null;
                                _error = null;
                              });
                            },
                      child: const Text('Retake'),
                    ),
                  ] else if (_camera != null)
                    Semantics(
                      button: true,
                      label: 'Capture food label',
                      child: InkWell(
                        onTap: _capture,
                        customBorder: const CircleBorder(),
                        child: Container(
                          width: 66,
                          height: 66,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: Theme.of(context).colorScheme.onSurface,
                              width: 3,
                            ),
                          ),
                          padding: const EdgeInsets.all(5),
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Theme.of(context).colorScheme.onSurface,
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
