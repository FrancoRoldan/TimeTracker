import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../bloc/time_entry_cubit.dart';
import '../../bloc/time_entry_state.dart';
import '../../../../core/models/time_entry.dart';
import '../../../../core/models/project.dart';
import '../../../../core/models/issue.dart';
import '../../../../core/enums/issue_status.dart';
import '../../../../shared/widgets/confirm_dialog.dart';
import '../../../project/bloc/project_cubit.dart';
import '../../../project/bloc/project_state.dart';
import '../../../issue/bloc/issue_cubit.dart';
import '../../../issue/bloc/issue_state.dart';

class TimeTrackerScreen extends StatefulWidget {
  const TimeTrackerScreen({super.key});

  @override
  State<TimeTrackerScreen> createState() => _TimeTrackerScreenState();
}

class _TimeTrackerScreenState extends State<TimeTrackerScreen> {
  Timer? _ticker;
  Duration _elapsed = Duration.zero;

  @override
  void initState() {
    super.initState();
    context.read<TimeEntryCubit>().loadEntries();
    context.read<IssueCubit>().loadMyIssues();
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  void _startTicker(TimeEntry entry) {
    _ticker?.cancel();
    _elapsed = entry.elapsed;
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _elapsed = entry.elapsed);
    });
  }

  void _stopTicker() {
    _ticker?.cancel();
    _ticker = null;
    _elapsed = Duration.zero;
  }

  String _format(Duration d) {
    final h = d.inHours.toString().padLeft(2, '0');
    final m = (d.inMinutes % 60).toString().padLeft(2, '0');
    final s = (d.inSeconds % 60).toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tiempo'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Actualizar',
            onPressed: () => context.read<TimeEntryCubit>().loadEntries(),
          ),
        ],
      ),
      body: BlocConsumer<TimeEntryCubit, TimeEntryState>(
        listener: (context, state) {
          if (state is TimeEntryLoaded) {
            if (state.hasActiveTimer) {
              _startTicker(state.activeTimer!);
            } else {
              _stopTicker();
              setState(() {});
            }
          }
          if (state is TimeEntryError) {
            ScaffoldMessenger.of(context)
              ..hideCurrentSnackBar()
              ..showSnackBar(
                SnackBar(
                  content: Text(state.message),
                  backgroundColor: Theme.of(context).colorScheme.error,
                  behavior: SnackBarBehavior.floating,
                ),
              );
          }
        },
        builder: (context, state) {
          if (state is TimeEntryLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (state is TimeEntryLoaded) {
            return Column(
              children: [
                _TimerCard(
                  activeTimer: state.activeTimer,
                  elapsed: _elapsed,
                  elapsedText: _format(_elapsed),
                  onStart: () => _showStartDialog(context),
                  onStop: () => context.read<TimeEntryCubit>().stopTimer(),
                ),
                const Divider(height: 1),
                Expanded(
                  child: state.entries.isEmpty
                      ? const _EmptyEntries()
                      : _EntriesList(
                          entries: state.entries,
                          onEdit: (entry) => _showEditDialog(context, entry),
                          onDelete: _showDeleteConfirmDialog,
                        ),
                ),
              ],
            );
          }
          return const Center(child: CircularProgressIndicator());
        },
      ),
      floatingActionButton: BlocBuilder<TimeEntryCubit, TimeEntryState>(
        builder: (context, state) {
          final hasActive = state is TimeEntryLoaded && state.hasActiveTimer;
          if (hasActive) return const SizedBox.shrink();
          return FloatingActionButton.extended(
            onPressed: () => _showManualEntryDialog(context),
            icon: const Icon(Icons.add),
            label: const Text('Registro manual'),
          );
        },
      ),
    );
  }

  void _showStartDialog(BuildContext context) {
    final projects = _getProjects(context);
    final issues = _getAvailableIssues(context);
    if (issues.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'No tenés issues asignados. Asignate un issue primero.',
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    showDialog(
      context: context,
      builder: (_) => _StartTimerDialog(
        projects: projects,
        issues: issues,
        onStart: (issueId, description) {
          context.read<TimeEntryCubit>().startTimer(
            issueId: issueId,
            description: description,
          );
        },
      ),
    );
  }

  void _showManualEntryDialog(BuildContext context) {
    final projects = _getProjects(context);
    final issues = _getAvailableIssues(context);
    if (issues.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'No tenés issues asignados. Asignate un issue primero.',
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    showDialog(
      context: context,
      builder: (_) => _ManualEntryDialog(
        projects: projects,
        issues: issues,
        onSave: (start, end, issueId, description) {
          context.read<TimeEntryCubit>().addManualEntry(
            startTime: start,
            endTime: end,
            issueId: issueId,
            description: description,
          );
        },
      ),
    );
  }

  void _showEditDialog(BuildContext context, TimeEntry entry) {
    final projects = _getProjects(context);
    final issues = _getAvailableIssues(context);
    showDialog(
      context: context,
      builder: (_) => _EditEntryDialog(
        entry: entry,
        projects: projects,
        issues: issues,
        onSave: (start, end, issueId, description) {
          context.read<TimeEntryCubit>().updateEntry(
            entry.id,
            issueId: issueId,
            startTime: start,
            endTime: end,
            description: description,
          );
        },
      ),
    );
  }

  Future<void> _showDeleteConfirmDialog(int id) async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Eliminar registro',
      message: '¿Eliminás este registro? Esta acción no se puede deshacer.',
    );
    if (confirmed && mounted) {
      await context.read<TimeEntryCubit>().deleteEntry(id);
    }
  }

  List<Project> _getProjects(BuildContext context) {
    final state = context.read<ProjectCubit>().state;
    return state is ProjectLoaded ? state.projects : [];
  }

  List<Issue> _getAvailableIssues(BuildContext context) {
    final state = context.read<IssueCubit>().state;
    if (state is! IssueLoaded) return [];
    return state.issues
        .where((i) => i.issueStatus != IssueStatus.done)
        .toList();
  }
}

// ── Timer card ────────────────────────────────────────────────────────────────

class _TimerCard extends StatelessWidget {
  const _TimerCard({
    required this.activeTimer,
    required this.elapsed,
    required this.elapsedText,
    required this.onStart,
    required this.onStop,
  });

  final TimeEntry? activeTimer;
  final Duration elapsed;
  final String elapsedText;
  final VoidCallback onStart;
  final VoidCallback onStop;

  @override
  Widget build(BuildContext context) {
    final isRunning = activeTimer != null;
    final cs = Theme.of(context).colorScheme;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      color: isRunning
          ? cs.primaryContainer.withValues(alpha: 0.4)
          : cs.surface,
      child: Column(
        children: [
          Text(
            elapsedText,
            style: Theme.of(context).textTheme.displayMedium?.copyWith(
              fontWeight: FontWeight.w300,
              fontFeatures: const [FontFeature.tabularFigures()],
              color: isRunning ? cs.primary : cs.onSurfaceVariant,
            ),
          ),
          if (activeTimer != null) ...[
            const SizedBox(height: 8),
            Text(
              activeTimer!.issueTitle ??
                  activeTimer!.projectName ??
                  'Sin descripción',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: cs.onSurfaceVariant),
            ),
          ],
          const SizedBox(height: 16),
          isRunning
              ? FilledButton.icon(
                  onPressed: onStop,
                  icon: const Icon(Icons.stop),
                  label: const Text('Detener'),
                  style: FilledButton.styleFrom(
                    backgroundColor: cs.error,
                    foregroundColor: cs.onError,
                  ),
                )
              : FilledButton.icon(
                  onPressed: onStart,
                  icon: const Icon(Icons.play_arrow),
                  label: const Text('Iniciar temporizador'),
                ),
        ],
      ),
    );
  }
}

// ── Entries list ──────────────────────────────────────────────────────────────

class _EntriesList extends StatelessWidget {
  const _EntriesList({
    required this.entries,
    required this.onEdit,
    required this.onDelete,
  });

  final List<TimeEntry> entries;
  final ValueChanged<TimeEntry> onEdit;
  final ValueChanged<int> onDelete;

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('dd/MM/yyyy HH:mm');
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: entries.length,
      itemBuilder: (context, i) {
        final e = entries[i];
        final duration = e.durationMinutes != null
            ? '${(e.durationMinutes! ~/ 60).toString().padLeft(2, '0')}:${(e.durationMinutes! % 60).toString().padLeft(2, '0')} h'
            : '—';
        return ListTile(
          leading: CircleAvatar(
            backgroundColor: Theme.of(context).colorScheme.secondaryContainer,
            child: Icon(
              Icons.timer_outlined,
              color: Theme.of(context).colorScheme.onSecondaryContainer,
              size: 20,
            ),
          ),
          title: Text(
            e.issueTitle ?? e.projectName ?? e.description ?? 'Sin descripción',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          subtitle: Text(fmt.format(e.startTime.toLocal())),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(duration, style: Theme.of(context).textTheme.labelMedium),
              const SizedBox(width: 4),
              IconButton(
                icon: const Icon(Icons.edit_outlined, size: 18),
                onPressed: () => onEdit(e),
                tooltip: 'Editar',
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline, size: 18),
                onPressed: () => onDelete(e.id),
                tooltip: 'Eliminar',
              ),
            ],
          ),
        );
      },
    );
  }
}

// ── Empty state ───────────────────────────────────────────────────────────────

class _EmptyEntries extends StatelessWidget {
  const _EmptyEntries();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.history,
            size: 64,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: 16),
          Text('Sin registros', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(
            'Iniciá un temporizador o agregá un registro manual',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

// ── Start timer dialog ────────────────────────────────────────────────────────

class _StartTimerDialog extends StatefulWidget {
  const _StartTimerDialog({
    required this.projects,
    required this.issues,
    required this.onStart,
  });

  final List<Project> projects;
  final List<Issue> issues;
  final void Function(int issueId, String? description) onStart;

  @override
  State<_StartTimerDialog> createState() => _StartTimerDialogState();
}

class _StartTimerDialogState extends State<_StartTimerDialog> {
  int? _projectId;
  int? _issueId;
  final _descCtrl = TextEditingController();

  @override
  void dispose() {
    _descCtrl.dispose();
    super.dispose();
  }

  List<Issue> get _filteredIssues {
    if (_projectId == null) return [];
    return widget.issues
        .where(
          (i) => i.projectId == _projectId && i.issueStatus != IssueStatus.done,
        )
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Iniciar temporizador'),
      content: SizedBox(
        width: 400,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (widget.projects.isNotEmpty) ...[
              DropdownButtonFormField<int>(
                initialValue: _projectId,
                decoration: const InputDecoration(
                  labelText: 'Proyecto *',
                  prefixIcon: Icon(Icons.folder_outlined),
                  border: OutlineInputBorder(),
                ),
                items: widget.projects
                    .map(
                      (p) => DropdownMenuItem(value: p.id, child: Text(p.name)),
                    )
                    .toList(),
                onChanged: (v) => setState(() {
                  _projectId = v;
                  _issueId = null;
                }),
              ),
              const SizedBox(height: 16),
            ],
            DropdownButtonFormField<int>(
              initialValue: _issueId,
              decoration: InputDecoration(
                labelText: 'Issue *',
                prefixIcon: const Icon(Icons.task_alt),
                border: const OutlineInputBorder(),
                errorText: _issueId == null ? null : null,
              ),
              items: [
                if (_projectId == null)
                  const DropdownMenuItem(
                    value: null,
                    child: Text('Seleccioná un proyecto primero'),
                  ),
                if (_projectId != null)
                  const DropdownMenuItem(
                    value: null,
                    child: Text('Seleccioná un issue'),
                  ),
                ..._filteredIssues.map(
                  (i) => DropdownMenuItem(
                    value: i.id,
                    child: Text(i.title, overflow: TextOverflow.ellipsis),
                  ),
                ),
              ],
              onChanged: _projectId == null
                  ? null
                  : (v) => setState(() => _issueId = v),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _descCtrl,
              decoration: const InputDecoration(
                labelText: 'Descripción (opcional)',
                prefixIcon: Icon(Icons.notes),
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancelar'),
        ),
        FilledButton.icon(
          onPressed: _projectId == null || _issueId == null
              ? null
              : () {
                  Navigator.pop(context);
                  widget.onStart(
                    _issueId!,
                    _descCtrl.text.trim().isEmpty
                        ? null
                        : _descCtrl.text.trim(),
                  );
                },
          icon: const Icon(Icons.play_arrow),
          label: const Text('Iniciar'),
        ),
      ],
    );
  }
}

// ── Manual entry dialog ───────────────────────────────────────────────────────

class _ManualEntryDialog extends StatefulWidget {
  const _ManualEntryDialog({
    required this.projects,
    required this.issues,
    required this.onSave,
  });

  final List<Project> projects;
  final List<Issue> issues;
  final void Function(
    DateTime start,
    DateTime end,
    int issueId,
    String? description,
  )
  onSave;

  @override
  State<_ManualEntryDialog> createState() => _ManualEntryDialogState();
}

class _ManualEntryDialogState extends State<_ManualEntryDialog> {
  DateTime _startTime = DateTime.now().subtract(const Duration(hours: 1));
  DateTime _endTime = DateTime.now();
  int? _projectId;
  int? _issueId;
  final _descCtrl = TextEditingController();

  @override
  void dispose() {
    _descCtrl.dispose();
    super.dispose();
  }

  List<Issue> get _filteredIssues {
    if (_projectId == null) return [];
    return widget.issues
        .where(
          (i) => i.projectId == _projectId && i.issueStatus != IssueStatus.done,
        )
        .toList();
  }

  Future<void> _pickDateTime({required bool isStart}) async {
    final initial = isStart ? _startTime : _endTime;
    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 1)),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initial),
    );
    if (time == null) return;
    final picked = DateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    );
    setState(() {
      if (isStart) {
        _startTime = picked;
      } else {
        _endTime = picked;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('dd/MM/yyyy HH:mm');
    return AlertDialog(
      title: const Text('Registro manual'),
      content: SizedBox(
        width: 480,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Expanded(
                    child: _DateTimeField(
                      label: 'Inicio',
                      value: fmt.format(_startTime),
                      onTap: () => _pickDateTime(isStart: true),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _DateTimeField(
                      label: 'Fin',
                      value: fmt.format(_endTime),
                      onTap: () => _pickDateTime(isStart: false),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (widget.projects.isNotEmpty) ...[
                DropdownButtonFormField<int>(
                  initialValue: _projectId,
                  decoration: const InputDecoration(
                    labelText: 'Proyecto *',
                    prefixIcon: Icon(Icons.folder_outlined),
                    border: OutlineInputBorder(),
                  ),
                  items: widget.projects
                      .map(
                        (p) =>
                            DropdownMenuItem(value: p.id, child: Text(p.name)),
                      )
                      .toList(),
                  onChanged: (v) => setState(() {
                    _projectId = v;
                    _issueId = null;
                  }),
                ),
                const SizedBox(height: 16),
              ],
              DropdownButtonFormField<int>(
                initialValue: _issueId,
                decoration: const InputDecoration(
                  labelText: 'Issue *',
                  prefixIcon: Icon(Icons.task_alt),
                  border: OutlineInputBorder(),
                ),
                items: [
                  if (_projectId == null)
                    const DropdownMenuItem(
                      value: null,
                      child: Text('Seleccioná un proyecto primero'),
                    ),
                  if (_projectId != null)
                    const DropdownMenuItem(
                      value: null,
                      child: Text('Seleccioná un issue'),
                    ),
                  ..._filteredIssues.map(
                    (i) => DropdownMenuItem(
                      value: i.id,
                      child: Text(i.title, overflow: TextOverflow.ellipsis),
                    ),
                  ),
                ],
                onChanged: _projectId == null
                    ? null
                    : (v) => setState(() => _issueId = v),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _descCtrl,
                decoration: const InputDecoration(
                  labelText: 'Descripción (opcional)',
                  prefixIcon: Icon(Icons.notes),
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: _projectId == null || _issueId == null
              ? null
              : () {
                  if (_endTime.isBefore(_startTime)) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('El fin debe ser posterior al inicio'),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                    return;
                  }
                  Navigator.pop(context);
                  widget.onSave(
                    _startTime,
                    _endTime,
                    _issueId!,
                    _descCtrl.text.trim().isEmpty
                        ? null
                        : _descCtrl.text.trim(),
                  );
                },
          child: const Text('Guardar'),
        ),
      ],
    );
  }
}

// ── Edit entry dialog ─────────────────────────────────────────────────────────

class _EditEntryDialog extends StatefulWidget {
  const _EditEntryDialog({
    required this.entry,
    required this.projects,
    required this.issues,
    required this.onSave,
  });

  final TimeEntry entry;
  final List<Project> projects;
  final List<Issue> issues;
  final void Function(
    DateTime start,
    DateTime end,
    int issueId,
    String? description,
  )
  onSave;

  @override
  State<_EditEntryDialog> createState() => _EditEntryDialogState();
}

class _EditEntryDialogState extends State<_EditEntryDialog> {
  late DateTime _startTime;
  late DateTime _endTime;
  late int? _projectId;
  late int? _issueId;
  late TextEditingController _descCtrl;

  @override
  void initState() {
    super.initState();
    _startTime = widget.entry.startTime.toLocal();
    _endTime =
        widget.entry.endTime?.toLocal() ??
        widget.entry.startTime.toLocal().add(const Duration(hours: 1));
    _projectId = widget.entry.projectId;
    _issueId = widget.entry.issueId;
    _descCtrl = TextEditingController(text: widget.entry.description ?? '');
  }

  @override
  void dispose() {
    _descCtrl.dispose();
    super.dispose();
  }

  List<Issue> get _filteredIssues {
    if (_projectId == null) return [];
    final all = widget.issues
        .where(
          (i) => i.projectId == _projectId && i.issueStatus != IssueStatus.done,
        )
        .toList();
    // If the current issueId is not in the filtered list, include it anyway
    if (_issueId != null && !all.any((i) => i.id == _issueId)) {
      final original = widget.issues.where((i) => i.id == _issueId);
      return [...all, ...original];
    }
    return all;
  }

  Future<void> _pickDateTime({required bool isStart}) async {
    final initial = isStart ? _startTime : _endTime;
    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 1)),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initial),
    );
    if (time == null) return;
    final picked = DateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    );
    setState(() {
      if (isStart) {
        _startTime = picked;
      } else {
        _endTime = picked;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('dd/MM/yyyy HH:mm');
    return AlertDialog(
      title: const Text('Editar registro'),
      content: SizedBox(
        width: 480,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Expanded(
                    child: _DateTimeField(
                      label: 'Inicio',
                      value: fmt.format(_startTime),
                      onTap: () => _pickDateTime(isStart: true),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _DateTimeField(
                      label: 'Fin',
                      value: fmt.format(_endTime),
                      onTap: () => _pickDateTime(isStart: false),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (widget.projects.isNotEmpty) ...[
                DropdownButtonFormField<int>(
                  initialValue: _projectId,
                  decoration: const InputDecoration(
                    labelText: 'Proyecto *',
                    prefixIcon: Icon(Icons.folder_outlined),
                    border: OutlineInputBorder(),
                  ),
                  items: widget.projects
                      .map(
                        (p) =>
                            DropdownMenuItem(value: p.id, child: Text(p.name)),
                      )
                      .toList(),
                  onChanged: (v) => setState(() {
                    _projectId = v;
                    _issueId = null;
                  }),
                ),
                const SizedBox(height: 16),
              ],
              DropdownButtonFormField<int>(
                initialValue: _issueId,
                decoration: const InputDecoration(
                  labelText: 'Issue *',
                  prefixIcon: Icon(Icons.task_alt),
                  border: OutlineInputBorder(),
                ),
                items: [
                  if (_projectId == null)
                    const DropdownMenuItem(
                      value: null,
                      child: Text('Seleccioná un proyecto primero'),
                    ),
                  if (_projectId != null)
                    const DropdownMenuItem(
                      value: null,
                      child: Text('Seleccioná un issue'),
                    ),
                  ..._filteredIssues.map(
                    (i) => DropdownMenuItem(
                      value: i.id,
                      child: Text(i.title, overflow: TextOverflow.ellipsis),
                    ),
                  ),
                ],
                onChanged: _projectId == null
                    ? null
                    : (v) => setState(() => _issueId = v),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _descCtrl,
                decoration: const InputDecoration(
                  labelText: 'Descripción (opcional)',
                  prefixIcon: Icon(Icons.notes),
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: _projectId == null || _issueId == null
              ? null
              : () {
                  if (_endTime.isBefore(_startTime)) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('El fin debe ser posterior al inicio'),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                    return;
                  }
                  Navigator.pop(context);
                  widget.onSave(
                    _startTime,
                    _endTime,
                    _issueId!,
                    _descCtrl.text.trim().isEmpty
                        ? null
                        : _descCtrl.text.trim(),
                  );
                },
          child: const Text('Guardar'),
        ),
      ],
    );
  }
}

// ── DateTime field ────────────────────────────────────────────────────────────

class _DateTimeField extends StatelessWidget {
  const _DateTimeField({
    required this.label,
    required this.value,
    required this.onTap,
  });

  final String label;
  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(4),
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          border: const OutlineInputBorder(),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 12,
            vertical: 8,
          ),
          suffixIcon: const Icon(Icons.edit_calendar, size: 16),
        ),
        child: Text(value, style: Theme.of(context).textTheme.bodyMedium),
      ),
    );
  }
}
