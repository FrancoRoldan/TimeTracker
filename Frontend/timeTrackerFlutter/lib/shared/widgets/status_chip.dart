import 'package:flutter/material.dart';

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
    final bg = color.withValues(alpha: 0.15);
    final fontSize = small ? 11.0 : 12.0;
    final padding = small
        ? const EdgeInsets.symmetric(horizontal: 6, vertical: 2)
        : const EdgeInsets.symmetric(horizontal: 8, vertical: 3);

    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: small ? 10 : 12, color: color),
            const SizedBox(width: 3),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: fontSize,
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
