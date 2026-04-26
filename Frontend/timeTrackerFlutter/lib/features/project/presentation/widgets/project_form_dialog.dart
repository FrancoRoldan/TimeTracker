import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../bloc/project_cubit.dart';
import '../../../../core/models/project.dart';
import '../../../../core/enums/project_status.dart';
import '../../../../core/storage/local_storage.dart';

class ProjectFormDialog extends StatefulWidget {
  const ProjectFormDialog({super.key, this.project});

  final Project? project;

  @override
  State<ProjectFormDialog> createState() => _ProjectFormDialogState();
}

class _ProjectFormDialogState extends State<ProjectFormDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameCtrl;
  DateTime? _startDate;
  DateTime? _endDate;
  ProjectStatus _status = ProjectStatus.active;
  bool _saving = false;
  String? _dateError;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.project?.name);
    _startDate = widget.project?.startDate;
    _endDate = widget.project?.endDate;
    if (widget.project != null) {
      _status = widget.project!.projectStatus;
    }
  }

  bool get isEditing => widget.project != null;

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate({required bool isStart}) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: (isStart ? _startDate : _endDate) ?? now,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    if (picked == null) return;
    setState(() {
      if (isStart) {
        _startDate = picked;
      } else {
        _endDate = picked;
      }
      _validateDates();
    });
  }

  void _validateDates() {
    if (_startDate != null && _endDate != null && _endDate!.isBefore(_startDate!)) {
      _dateError = 'La fecha de fin debe ser posterior a la de inicio';
    } else {
      _dateError = null;
    }
  }

  bool get _datesValid => _dateError == null;

  Future<void> _submit() async {
    _validateDates();
    if (!_formKey.currentState!.validate()) return;
    if (_startDate == null) {
      setState(() {});
      return;
    }
    if (!_datesValid) {
      setState(() {});
      return;
    }
    setState(() => _saving = true);
    final cubit = context.read<ProjectCubit>();
    final companyId = context.read<LocalStorage>().getSelectedCompanyId();
    if (isEditing) {
      await cubit.updateProject(
        widget.project!.id,
        name: _nameCtrl.text.trim(),
        startDate: _startDate,
        endDate: _endDate,
        status: _status.value,
        companyId: companyId,
      );
    } else {
      await cubit.createProject(
        name: _nameCtrl.text.trim(),
        startDate: _startDate,
        endDate: _endDate,
        status: _status.value,
        companyId: companyId,
      );
    }
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('dd/MM/yyyy');
    return AlertDialog(
      title: Text(isEditing ? 'Editar proyecto' : 'Nuevo proyecto'),
      content: SizedBox(
        width: 400,
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Name
              TextFormField(
                controller: _nameCtrl,
                autofocus: true,
                decoration: const InputDecoration(
                  labelText: 'Nombre del proyecto',
                  prefixIcon: Icon(Icons.folder_outlined),
                  border: OutlineInputBorder(),
                ),
                maxLength: 200,
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? 'El nombre es obligatorio' : null,
              ),
              const SizedBox(height: 16),

              // Status
              DropdownButtonFormField<ProjectStatus>(
                key: ValueKey(_status),
                initialValue: _status,
                decoration: const InputDecoration(
                  labelText: 'Estado',
                  prefixIcon: Icon(Icons.flag_outlined),
                  border: OutlineInputBorder(),
                ),
                items: ProjectStatus.values.map((s) {
                  return DropdownMenuItem(
                    value: s,
                    child: Text(s.label),
                  );
                }).toList(),
                onChanged: (v) {
                  if (v != null) setState(() => _status = v);
                },
              ),
              const SizedBox(height: 16),

              // Start date (required)
              _DatePickerField(
                label: 'Fecha de inicio *',
                value: _startDate != null ? fmt.format(_startDate!) : null,
                onTap: () => _pickDate(isStart: true),
                onClear: () => setState(() {
                  _startDate = null;
                  _validateDates();
                }),
                errorText: _startDate == null && _saving ? 'La fecha de inicio es obligatoria' : null,
              ),
              const SizedBox(height: 16),

              // End date (optional)
              _DatePickerField(
                label: 'Fecha de fin (opcional)',
                value: _endDate != null ? fmt.format(_endDate!) : null,
                onTap: () => _pickDate(isStart: false),
                onClear: () => setState(() {
                  _endDate = null;
                  _validateDates();
                }),
                errorText: _dateError,
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: _saving ? null : () => Navigator.pop(context),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: _saving ? null : _submit,
          child: _saving
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : Text(isEditing ? 'Guardar' : 'Crear'),
        ),
      ],
    );
  }
}

class _DatePickerField extends StatelessWidget {
  const _DatePickerField({
    required this.label,
    required this.onTap,
    required this.onClear,
    this.value,
    this.errorText,
  });

  final String label;
  final String? value;
  final VoidCallback onTap;
  final VoidCallback onClear;
  final String? errorText;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(4),
          child: InputDecorator(
            decoration: InputDecoration(
              labelText: label,
              border: OutlineInputBorder(
                borderSide: errorText != null
                    ? BorderSide(color: Theme.of(context).colorScheme.error)
                    : const BorderSide(),
              ),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              suffixIcon: value != null
                  ? IconButton(
                      icon: const Icon(Icons.clear, size: 16),
                      onPressed: onClear,
                    )
                  : const Icon(Icons.calendar_today, size: 16),
            ),
            child: Text(
              value ?? '—',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: value == null
                        ? Theme.of(context).colorScheme.onSurfaceVariant
                        : null,
                  ),
            ),
          ),
        ),
        if (errorText != null)
          Padding(
            padding: const EdgeInsets.only(top: 4, left: 12),
            child: Text(
              errorText!,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.error,
                  ),
            ),
          ),
      ],
    );
  }
}
