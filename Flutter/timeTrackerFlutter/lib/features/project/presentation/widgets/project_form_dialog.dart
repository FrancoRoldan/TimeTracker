import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../bloc/project_cubit.dart';
import '../../../../core/models/project.dart';
import '../../../../core/storage/local_storage.dart';

class ProjectFormDialog extends StatefulWidget {
  const ProjectFormDialog({super.key, this.project});

  /// null → crear, non-null → editar
  final Project? project;

  @override
  State<ProjectFormDialog> createState() => _ProjectFormDialogState();
}

class _ProjectFormDialogState extends State<ProjectFormDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameCtrl;
  DateTime? _startDate;
  DateTime? _endDate;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.project?.name);
    _startDate = widget.project?.startDate;
    _endDate = widget.project?.endDate;
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
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final cubit = context.read<ProjectCubit>();
    final companyId = context.read<LocalStorage>().getSelectedCompanyId();
    if (isEditing) {
      await cubit.updateProject(
        widget.project!.id,
        name: _nameCtrl.text.trim(),
        startDate: _startDate,
        endDate: _endDate,
        companyId: companyId,
      );
    } else {
      await cubit.createProject(
        name: _nameCtrl.text.trim(),
        startDate: _startDate,
        endDate: _endDate,
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
              TextFormField(
                controller: _nameCtrl,
                autofocus: true,
                decoration: const InputDecoration(
                  labelText: 'Nombre',
                  prefixIcon: Icon(Icons.folder_outlined),
                  border: OutlineInputBorder(),
                ),
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? 'Requerido' : null,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _DatePickerField(
                      label: 'Inicio',
                      value: _startDate != null ? fmt.format(_startDate!) : null,
                      onTap: () => _pickDate(isStart: true),
                      onClear: () => setState(() => _startDate = null),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _DatePickerField(
                      label: 'Fin',
                      value: _endDate != null ? fmt.format(_endDate!) : null,
                      onTap: () => _pickDate(isStart: false),
                      onClear: () => setState(() => _endDate = null),
                    ),
                  ),
                ],
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
                  width: 18, height: 18,
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
  });

  final String label;
  final String? value;
  final VoidCallback onTap;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(4),
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          border: const OutlineInputBorder(),
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
    );
  }
}
