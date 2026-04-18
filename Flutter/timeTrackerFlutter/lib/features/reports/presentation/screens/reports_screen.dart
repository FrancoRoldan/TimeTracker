import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../../bloc/reports_cubit.dart';
import '../../bloc/reports_state.dart';
import '../../../../core/models/reports/user_report.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  DateTime _dateFrom =
      DateTime.now().subtract(const Duration(days: 30));
  DateTime _dateTo = DateTime.now();

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    context.read<ReportsCubit>().loadUserReport(
          dateFrom: _dateFrom,
          dateTo: _dateTo,
        );
  }

  Future<void> _pickDateRange() async {
    final range = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      initialDateRange: DateTimeRange(start: _dateFrom, end: _dateTo),
    );
    if (range == null) return;
    setState(() {
      _dateFrom = range.start;
      _dateTo = range.end;
    });
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('dd/MM/yyyy');
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reportes'),
        actions: [
          TextButton.icon(
            onPressed: _pickDateRange,
            icon: const Icon(Icons.date_range),
            label: Text(
                '${fmt.format(_dateFrom)} – ${fmt.format(_dateTo)}'),
          ),
        ],
      ),
      body: BlocConsumer<ReportsCubit, ReportsState>(
        listener: (context, state) {
          if (state is ReportsError) {
            ScaffoldMessenger.of(context)
              ..hideCurrentSnackBar()
              ..showSnackBar(SnackBar(
                content: Text(state.message),
                backgroundColor: Theme.of(context).colorScheme.error,
                behavior: SnackBarBehavior.floating,
              ));
          }
        },
        builder: (context, state) {
          if (state is ReportsLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (state is UserReportLoaded) {
            return _UserReportView(report: state.report);
          }
          if (state is ReportsError) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline, size: 48),
                  const SizedBox(height: 12),
                  Text(state.message, textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: _load,
                    child: const Text('Reintentar'),
                  ),
                ],
              ),
            );
          }
          return const Center(child: CircularProgressIndicator());
        },
      ),
    );
  }
}

class _UserReportView extends StatelessWidget {
  const _UserReportView({required this.report});

  final UserReport report;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SummaryRow(report: report),
          const SizedBox(height: 24),
          if (report.dailyBreakdown.isNotEmpty) ...[
            Text('Horas por día',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            SizedBox(
              height: 200,
              child: _DailyBarChart(data: report.dailyBreakdown),
            ),
            const SizedBox(height: 24),
          ],
          if (report.projectBreakdown.isNotEmpty) ...[
            Text('Por proyecto',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            ...report.projectBreakdown.map(
              (p) => _BreakdownRow(
                label: p.projectName,
                hours: p.totalHours,
                total: report.totalHours,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
            const SizedBox(height: 24),
          ],
          if (report.issueTypeBreakdown.isNotEmpty) ...[
            Text('Por tipo de issue',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 160,
                  height: 160,
                  child: _TypePieChart(data: report.issueTypeBreakdown),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    children: report.issueTypeBreakdown
                        .asMap()
                        .entries
                        .map((entry) => _LegendRow(
                              label: entry.value.label,
                              hours: entry.value.totalHours,
                              index: entry.key,
                            ))
                        .toList(),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({required this.report});
  final UserReport report;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Row(
      children: [
        Expanded(
          child: _StatCard(
            label: 'Total horas',
            value: report.totalHours.toStringAsFixed(1),
            icon: Icons.schedule,
            color: cs.primary,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatCard(
            label: 'Proyectos',
            value: report.projectBreakdown.length.toString(),
            icon: Icons.folder_outlined,
            color: cs.secondary,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatCard(
            label: 'Issues',
            value: report.issueBreakdown.length.toString(),
            icon: Icons.task_alt,
            color: cs.tertiary,
          ),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Icon(icon, color: color),
            const SizedBox(height: 8),
            Text(value,
                style: Theme.of(context)
                    .textTheme
                    .headlineSmall
                    ?.copyWith(fontWeight: FontWeight.bold)),
            Text(label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    )),
          ],
        ),
      ),
    );
  }
}

class _DailyBarChart extends StatelessWidget {
  const _DailyBarChart({required this.data});

  final List<DailyBreakdown> data;

  @override
  Widget build(BuildContext context) {
    final color = Theme.of(context).colorScheme.primary;
    final gridColor =
        Theme.of(context).colorScheme.outlineVariant.withValues(alpha: 0.5);
    final rawMax =
        data.map((d) => d.totalHours).fold(0.0, (a, b) => a > b ? a : b);
    final maxY = rawMax < 1 ? 2.0 : rawMax * 1.2;

    // Mostrar etiqueta cada N días para no sobrecargar el eje
    final step = data.length > 14
        ? 7
        : data.length > 7
            ? 3
            : 1;

    return BarChart(
      BarChartData(
        maxY: maxY,
        minY: 0,
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          horizontalInterval: maxY / 4,
          getDrawingHorizontalLine: (_) =>
              FlLine(color: gridColor, strokeWidth: 1),
        ),
        borderData: FlBorderData(show: false),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 32,
              interval: maxY / 4,
              getTitlesWidget: (value, meta) {
                if (value == 0) return const SizedBox.shrink();
                return SideTitleWidget(
                  axisSide: meta.axisSide,
                  child: Text(
                    value.toStringAsFixed(0),
                    style: Theme.of(context).textTheme.labelSmall,
                  ),
                );
              },
            ),
          ),
          rightTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false)),
          topTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false)),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 28,
              getTitlesWidget: (value, meta) {
                final idx = value.toInt();
                if (idx < 0 || idx >= data.length || idx % step != 0) {
                  return const SizedBox.shrink();
                }
                final dt = DateTime.tryParse(data[idx].date);
                final label = dt != null
                    ? DateFormat('dd/MM').format(dt)
                    : data[idx].date;
                return SideTitleWidget(
                  axisSide: meta.axisSide,
                  child: Text(
                    label,
                    style: Theme.of(context).textTheme.labelSmall,
                  ),
                );
              },
            ),
          ),
        ),
        barGroups: data.asMap().entries.map((entry) {
          return BarChartGroupData(
            x: entry.key,
            barRods: [
              BarChartRodData(
                toY: entry.value.totalHours,
                color: color,
                width: data.length > 20 ? 6 : 12,
                borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(4)),
              ),
            ],
          );
        }).toList(),
        barTouchData: BarTouchData(
          touchTooltipData: BarTouchTooltipData(
            getTooltipItem: (group, groupIndex, rod, rodIndex) {
              final d = data[group.x];
              final dt = DateTime.tryParse(d.date);
              final dateLabel = dt != null ? DateFormat('dd/MM/yyyy').format(dt) : d.date;
              return BarTooltipItem(
                '$dateLabel\n${rod.toY.toStringAsFixed(1)}h',
                Theme.of(context).textTheme.labelSmall!.copyWith(
                      color: Colors.white,
                    ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _BreakdownRow extends StatelessWidget {
  const _BreakdownRow({
    required this.label,
    required this.hours,
    required this.total,
    required this.color,
  });

  final String label;
  final double hours;
  final double total;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final pct = total > 0 ? hours / total : 0.0;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: Theme.of(context).textTheme.bodyMedium),
              Text('${hours.toStringAsFixed(1)}h',
                  style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
          const SizedBox(height: 4),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: pct,
              minHeight: 6,
              backgroundColor:
                  Theme.of(context).colorScheme.surfaceContainerHighest,
              valueColor: AlwaysStoppedAnimation(color),
            ),
          ),
        ],
      ),
    );
  }
}

class _TypePieChart extends StatelessWidget {
  const _TypePieChart({required this.data});

  final List<IssueTypeBreakdown> data;

  static const _colors = [
    Color(0xFF2196F3),
    Color(0xFFF44336),
    Color(0xFF4CAF50),
    Color(0xFFFF9800),
    Color(0xFF9C27B0),
  ];

  @override
  Widget build(BuildContext context) {
    return PieChart(
      PieChartData(
        sections: data.asMap().entries.map((entry) {
          final color = _colors[entry.key % _colors.length];
          return PieChartSectionData(
            value: entry.value.totalHours,
            color: color,
            title: '',
            radius: 50,
          );
        }).toList(),
        centerSpaceRadius: 30,
        sectionsSpace: 2,
      ),
    );
  }
}

class _LegendRow extends StatelessWidget {
  const _LegendRow({required this.label, required this.hours, this.index = 0});

  final String label;
  final double hours;
  final int index;

  static const _colors = [
    Color(0xFF2196F3),
    Color(0xFFF44336),
    Color(0xFF4CAF50),
    Color(0xFFFF9800),
    Color(0xFF9C27B0),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: _colors[index % _colors.length],
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(label,
                style: Theme.of(context).textTheme.bodySmall),
          ),
          Text('${hours.toStringAsFixed(1)}h',
              style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}
