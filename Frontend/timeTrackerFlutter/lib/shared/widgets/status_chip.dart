import 'package:flutter/material.dart';

/// Chip de estado que replica el estilo del Angular:
/// fondo sólido coloreado, texto blanco, border-radius 4px, font-weight 600.
class StatusChip extends StatelessWidget {
  const StatusChip({
    required this.label,
    required this.color,
    super.key,
    this.icon,
    this.small = false,
  });

  final String label;
  final Color color;
  final IconData? icon;
  final bool small;

  @override
  Widget build(BuildContext context) {
    final fontSize = small ? 10.0 : 12.0;
    final padding = small
        ? const EdgeInsets.symmetric(horizontal: 6, vertical: 2)
        : const EdgeInsets.symmetric(horizontal: 8, vertical: 4);

    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: small ? 10 : 11, color: Colors.white),
            const SizedBox(width: 3),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: fontSize,
              color: Colors.white,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }
}
