import 'dart:async';
import 'package:flutter/material.dart';
import '../../app/theme/app_theme.dart';
import '../../core/models/time_entry.dart';

/// Pill flotante que aparece en todas las rutas cuando hay un timer activo.
/// Replica el widget flotante del Angular (border-radius 28px, border 2px primary).
class FloatingTimerPill extends StatefulWidget {
  const FloatingTimerPill({
    required this.activeTimer,
    required this.onStop,
    super.key,
  });

  final TimeEntry activeTimer;
  final VoidCallback onStop;

  @override
  State<FloatingTimerPill> createState() => _FloatingTimerPillState();
}

class _FloatingTimerPillState extends State<FloatingTimerPill> {
  Timer? _ticker;
  Duration _elapsed = Duration.zero;

  @override
  void initState() {
    super.initState();
    _elapsed = widget.activeTimer.elapsed;
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _elapsed = widget.activeTimer.elapsed);
    });
  }

  @override
  void didUpdateWidget(FloatingTimerPill oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.activeTimer.id != widget.activeTimer.id) {
      _elapsed = widget.activeTimer.elapsed;
    }
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  String _fmt(Duration d) {
    final h = d.inHours.toString().padLeft(2, '0');
    final m = (d.inMinutes % 60).toString().padLeft(2, '0');
    final s = (d.inSeconds % 60).toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final entry = widget.activeTimer;
    final title = entry.issueTitle ?? entry.projectName ?? 'Tiempo activo';
    final project = entry.projectName;
    final hasProject = project != null && entry.issueTitle != null;

    return Material(
      elevation: 6,
      borderRadius: BorderRadius.circular(28),
      shadowColor: cs.primary.withValues(alpha: 0.3),
      child: Container(
        constraints: const BoxConstraints(minWidth: 220, maxWidth: 320),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: cs.primary, width: 2),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.timer, size: 16, color: cs.primary),
            const SizedBox(width: 8),
            Flexible(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _fmt(_elapsed),
                    style: AppTheme.timerPill(cs),
                  ),
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: cs.onSurface,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (hasProject)
                    Text(
                      project,
                      style: TextStyle(
                        fontSize: 10,
                        color: cs.onSurfaceVariant,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            // Stop button — mini FAB, color error (rojo)
            SizedBox(
              width: 34,
              height: 34,
              child: FilledButton(
                onPressed: widget.onStop,
                style: FilledButton.styleFrom(
                  backgroundColor: cs.error,
                  foregroundColor: cs.onError,
                  padding: EdgeInsets.zero,
                  shape: const CircleBorder(),
                  minimumSize: const Size(34, 34),
                ),
                child: const Icon(Icons.stop, size: 16),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
