import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../../bloc/reports_cubit.dart';
import '../../bloc/reports_state.dart';
import '../../../../core/models/reports/user_report.dart';
import '../../../../core/models/reports/project_report.dart';
import '../../../../core/models/reports/company_report.dart';
import '../../../../core/storage/local_storage.dart';
import '../../../company/bloc/company_cubit.dart';
import '../../../company/bloc/company_state.dart';
import '../../../company/presentation/widgets/company_selector.dart';
import '../../../project/bloc/project_cubit.dart';
import '../../../project/bloc/project_state.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  DateTime _dateFrom = DateTime.now().subtract(const Duration(days: 30));
  DateTime _dateTo = DateTime.now();
  int? _selectedProjectId;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(_onTabChanged);
    _loadCurrent();
  }

  @override
  void dispose() {
    _tabController
      ..removeListener(_onTabChanged)
      ..dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (!_tabController.indexIsChanging) _loadCurrent();
  }

  void _loadCurrent() {
    final cubit = context.read<ReportsCubit>();
    switch (_tabController.index) {
      case 0:
        cubit.loadUserReport(dateFrom: _dateFrom, dateTo: _dateTo);
      case 1:
        if (_selectedProjectId != null) {
          cubit.loadProjectReport(_selectedProjectId!,
              dateFrom: _dateFrom, dateTo: _dateTo);
        }
      case 2:
        final companyId = context.read<LocalStorage>().getSelectedCompanyId();
        if (companyId != null) {
          cubit.loadCompanyReport(companyId,
              dateFrom: _dateFrom, dateTo: _dateTo);
        }
    }
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
    _loadCurrent();
  }

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('dd/MM/yy');
    return BlocListener<CompanyCubit, CompanyState>(
      listenWhen: (p, c) =>
          p is CompanyLoaded &&
          c is CompanyLoaded &&
          p.selectedCompany?.companyId != c.selectedCompany?.companyId,
      listener: (_, __) {
        setState(() => _selectedProjectId = null);
        _loadCurrent();
      },
      child: Scaffold(
      appBar: AppBar(
        title: const Text('Reportes'),
        actions: [
          const CompanySelectorWidget(),
          TextButton.icon(
            onPressed: _pickDateRange,
            icon: const Icon(Icons.date_range, size: 18),
            label: Text('${fmt.format(_dateFrom)} – ${fmt.format(_dateTo)}'),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Personal'),
            Tab(text: 'Proyecto'),
            Tab(text: 'Empresa'),
          ],
        ),
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
          return TabBarView(
            controller: _tabController,
            children: [
              // ── Tab 0: Personal ────────────────────────────────────────
              _tabBody(
                state: state,
                expectedType: UserReportLoaded,
                builder: () =>
                    _UserReportView(report: (state as UserReportLoaded).report),
                onRetry: _loadCurrent,
              ),

              // ── Tab 1: Proyecto ────────────────────────────────────────
              _ProjectTab(
                state: state,
                selectedProjectId: _selectedProjectId,
                onProjectSelected: (id) {
                  setState(() => _selectedProjectId = id);
                  if (id != null) {
                    context.read<ReportsCubit>().loadProjectReport(id,
                        dateFrom: _dateFrom, dateTo: _dateTo);
                  }
                },
                onRetry: _loadCurrent,
              ),

              // ── Tab 2: Empresa ─────────────────────────────────────────
              _tabBody(
                state: state,
                expectedType: CompanyReportLoaded,
                builder: () => _CompanyReportView(
                    report: (state as CompanyReportLoaded).report),
                onRetry: _loadCurrent,
              ),
            ],
          );
        },
      ),
      ),
    );
  }

  Widget _tabBody({
    required ReportsState state,
    required Type expectedType,
    required Widget Function() builder,
    required VoidCallback onRetry,
  }) {
    if (state is ReportsLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (state.runtimeType == expectedType) return builder();
    if (state is ReportsError) {
      return _ErrorView(message: state.message, onRetry: onRetry);
    }
    return const Center(child: CircularProgressIndicator());
  }
}

// ── User Report ───────────────────────────────────────────────────────────────

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
          _StatRow(cards: [
            _StatCard(
              label: 'Total horas',
              value: '${report.totalHours.toStringAsFixed(1)}h',
              icon: Icons.schedule,
              color: Theme.of(context).colorScheme.primary,
            ),
            _StatCard(
              label: 'Proyectos',
              value: report.projectBreakdown.length.toString(),
              icon: Icons.folder_outlined,
              color: Theme.of(context).colorScheme.secondary,
            ),
            _StatCard(
              label: 'Issues',
              value: report.issueBreakdown.length.toString(),
              icon: Icons.task_alt,
              color: Theme.of(context).colorScheme.tertiary,
            ),
          ]),
          if (report.dailyBreakdown.isNotEmpty) ...[
            const SizedBox(height: 24),
            const _SectionTitle('Horas por día'),
            const SizedBox(height: 12),
            SizedBox(height: 200, child: _DailyBarChart(data: report.dailyBreakdown)),
          ],
          if (report.projectBreakdown.isNotEmpty) ...[
            const SizedBox(height: 24),
            const _SectionTitle('Por proyecto'),
            const SizedBox(height: 8),
            ...report.projectBreakdown.map((p) => _BreakdownRow(
                  label: p.projectName,
                  hours: p.totalHours,
                  total: report.totalHours,
                  color: Theme.of(context).colorScheme.primary,
                )),
          ],
          if (report.issueTypeBreakdown.isNotEmpty) ...[
            const SizedBox(height: 24),
            const _SectionTitle('Por tipo de issue'),
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
                        .map((e) => _LegendRow(
                              label: e.value.label,
                              hours: e.value.totalHours,
                              index: e.key,
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

// ── Project Tab ───────────────────────────────────────────────────────────────

class _ProjectTab extends StatelessWidget {
  const _ProjectTab({
    required this.state,
    required this.selectedProjectId,
    required this.onProjectSelected,
    required this.onRetry,
  });

  final ReportsState state;
  final int? selectedProjectId;
  final ValueChanged<int?> onProjectSelected;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Project selector
        BlocBuilder<ProjectCubit, ProjectState>(
          builder: (context, projectState) {
            final projects =
                projectState is ProjectLoaded ? projectState.projects : [];
            return Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: DropdownButtonFormField<int>(
                decoration: const InputDecoration(
                  labelText: 'Seleccionar proyecto',
                  prefixIcon: Icon(Icons.folder_outlined),
                  border: OutlineInputBorder(),
                ),
                initialValue: selectedProjectId,
                hint: const Text('Elegir proyecto'),
                items: projects
                    .map((p) =>
                        DropdownMenuItem<int>(value: p.id, child: Text(p.name)))
                    .toList(),
                onChanged: onProjectSelected,
              ),
            );
          },
        ),
        const SizedBox(height: 12),
        Expanded(
          child: () {
            if (selectedProjectId == null) {
              return const Center(
                child: Text('Seleccioná un proyecto para ver su reporte'),
              );
            }
            if (state is ReportsLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state is ProjectReportLoaded) {
              return _ProjectReportView(
                  report: (state as ProjectReportLoaded).report);
            }
            if (state is ReportsError) {
              return _ErrorView(
                  message: (state as ReportsError).message, onRetry: onRetry);
            }
            return const Center(child: CircularProgressIndicator());
          }(),
        ),
      ],
    );
  }
}

class _ProjectReportView extends StatelessWidget {
  const _ProjectReportView({required this.report});
  final ProjectReport report;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StatRow(cards: [
            _StatCard(
              label: 'Total horas',
              value: '${report.totalHours.toStringAsFixed(1)}h',
              icon: Icons.schedule,
              color: Theme.of(context).colorScheme.primary,
            ),
            _StatCard(
              label: 'Colaboradores',
              value: report.userBreakdown.length.toString(),
              icon: Icons.group_outlined,
              color: Theme.of(context).colorScheme.secondary,
            ),
            _StatCard(
              label: 'Issues',
              value: report.issueBreakdown.length.toString(),
              icon: Icons.task_alt,
              color: Theme.of(context).colorScheme.tertiary,
            ),
          ]),
          if (report.dailyBreakdown.isNotEmpty) ...[
            const SizedBox(height: 24),
            const _SectionTitle('Horas por día'),
            const SizedBox(height: 12),
            SizedBox(
                height: 200,
                child: _DailyBarChart(data: report.dailyBreakdown)),
          ],
          if (report.userBreakdown.isNotEmpty) ...[
            const SizedBox(height: 24),
            const _SectionTitle('Por colaborador'),
            const SizedBox(height: 8),
            ...report.userBreakdown.map((u) => _BreakdownRow(
                  label: u.userName,
                  hours: u.totalHours,
                  total: report.totalHours,
                  color: Theme.of(context).colorScheme.secondary,
                )),
          ],
        ],
      ),
    );
  }
}

// ── Company Report ────────────────────────────────────────────────────────────

class _CompanyReportView extends StatelessWidget {
  const _CompanyReportView({required this.report});
  final CompanyReport report;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StatRow(cards: [
            _StatCard(
              label: 'Total horas',
              value: '${report.totalHours.toStringAsFixed(1)}h',
              icon: Icons.schedule,
              color: Theme.of(context).colorScheme.primary,
            ),
            _StatCard(
              label: 'Proyectos',
              value: report.projectBreakdown.length.toString(),
              icon: Icons.folder_outlined,
              color: Theme.of(context).colorScheme.secondary,
            ),
            _StatCard(
              label: 'Personas',
              value: report.userBreakdown.length.toString(),
              icon: Icons.group_outlined,
              color: Theme.of(context).colorScheme.tertiary,
            ),
          ]),
          if (report.dailyBreakdown.isNotEmpty) ...[
            const SizedBox(height: 24),
            const _SectionTitle('Horas por día (empresa)'),
            const SizedBox(height: 12),
            SizedBox(
                height: 200,
                child: _DailyBarChart(data: report.dailyBreakdown)),
          ],
          if (report.projectBreakdown.isNotEmpty) ...[
            const SizedBox(height: 24),
            const _SectionTitle('Por proyecto'),
            const SizedBox(height: 8),
            ...report.projectBreakdown.map((p) => _BreakdownRow(
                  label: p.projectName,
                  hours: p.totalHours,
                  total: report.totalHours,
                  color: Theme.of(context).colorScheme.primary,
                )),
          ],
          if (report.userBreakdown.isNotEmpty) ...[
            const SizedBox(height: 24),
            const _SectionTitle('Por colaborador'),
            const SizedBox(height: 8),
            ...report.userBreakdown.map((u) => _BreakdownRow(
                  label: u.userName,
                  hours: u.totalHours,
                  total: report.totalHours,
                  color: Theme.of(context).colorScheme.tertiary,
                )),
          ],
          if (report.userBreakdown.isNotEmpty &&
              report.projectBreakdown.isNotEmpty) ...[
            const SizedBox(height: 24),
            const _SectionTitle('Distribución por proyecto'),
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 160,
                  height: 160,
                  child: _ProjectPieChart(data: report.projectBreakdown),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    children: report.projectBreakdown
                        .asMap()
                        .entries
                        .map((e) => _LegendRow(
                              label: e.value.projectName,
                              hours: e.value.totalHours,
                              index: e.key,
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

// ── Shared widgets ────────────────────────────────────────────────────────────

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title);
  final String title;

  @override
  Widget build(BuildContext context) =>
      Text(title, style: Theme.of(context).textTheme.titleMedium);
}

class _StatRow extends StatelessWidget {
  const _StatRow({required this.cards});
  final List<Widget> cards;

  @override
  Widget build(BuildContext context) => Row(
        children: cards
            .expand((c) => [Expanded(child: c), const SizedBox(width: 8)])
            .toList()
          ..removeLast(),
      );
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
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Icon(icon, color: color),
            const SizedBox(height: 6),
            Text(value,
                style: Theme.of(context)
                    .textTheme
                    .titleLarge
                    ?.copyWith(fontWeight: FontWeight.bold)),
            Text(label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                textAlign: TextAlign.center),
          ],
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
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(label,
                    style: Theme.of(context).textTheme.bodyMedium,
                    overflow: TextOverflow.ellipsis),
              ),
              Text('${hours.toStringAsFixed(1)}h  ${(pct * 100).toStringAsFixed(0)}%',
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

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline, size: 48),
          const SizedBox(height: 12),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 16),
          FilledButton(onPressed: onRetry, child: const Text('Reintentar')),
        ],
      ),
    );
  }
}

// ── Charts ────────────────────────────────────────────────────────────────────

const _chartColors = [
  Color(0xFF2196F3),
  Color(0xFFF44336),
  Color(0xFF4CAF50),
  Color(0xFFFF9800),
  Color(0xFF9C27B0),
  Color(0xFF00BCD4),
];

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
    final step = data.length > 14 ? 7 : data.length > 7 ? 3 : 1;

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
                  child: Text(value.toStringAsFixed(0),
                      style: Theme.of(context).textTheme.labelSmall),
                );
              },
            ),
          ),
          rightTitles:
              const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles:
              const AxisTitles(sideTitles: SideTitles(showTitles: false)),
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
                  child: Text(label,
                      style: Theme.of(context).textTheme.labelSmall),
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
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(4)),
              ),
            ],
          );
        }).toList(),
        barTouchData: BarTouchData(
          touchTooltipData: BarTouchTooltipData(
            getTooltipItem: (group, _, rod, __) {
              final d = data[group.x];
              final dt = DateTime.tryParse(d.date);
              final label =
                  dt != null ? DateFormat('dd/MM/yy').format(dt) : d.date;
              return BarTooltipItem(
                '$label\n${rod.toY.toStringAsFixed(1)}h',
                Theme.of(context)
                    .textTheme
                    .labelSmall!
                    .copyWith(color: Colors.white),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _TypePieChart extends StatelessWidget {
  const _TypePieChart({required this.data});
  final List<IssueTypeBreakdown> data;

  @override
  Widget build(BuildContext context) {
    return PieChart(
      PieChartData(
        sections: data.asMap().entries.map((e) {
          return PieChartSectionData(
            value: e.value.totalHours,
            color: _chartColors[e.key % _chartColors.length],
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

class _ProjectPieChart extends StatelessWidget {
  const _ProjectPieChart({required this.data});
  final List<ProjectBreakdown> data;

  @override
  Widget build(BuildContext context) {
    return PieChart(
      PieChartData(
        sections: data.asMap().entries.map((e) {
          return PieChartSectionData(
            value: e.value.totalHours,
            color: _chartColors[e.key % _chartColors.length],
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
              color: _chartColors[index % _chartColors.length],
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
              child: Text(label, style: Theme.of(context).textTheme.bodySmall)),
          Text('${hours.toStringAsFixed(1)}h',
              style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}
