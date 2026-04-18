import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../bloc/issue_cubit.dart';
import '../../../../core/models/issue.dart';
import '../../../../core/models/project.dart';
import '../../../../core/models/company.dart';
import '../../../../core/enums/issue_status.dart';
import '../../../../core/enums/issue_type.dart';
import '../../../../core/enums/issue_priority.dart';

class IssueFormDialog extends StatefulWidget {
  const IssueFormDialog({
    super.key,
    this.issue,
    this.projects = const [],
    this.companyUsers = const [],
  });

  final Issue? issue;
  final List<Project> projects;
  final List<CompanyUser> companyUsers;

  @override
  State<IssueFormDialog> createState() => _IssueFormDialogState();
}

class _IssueFormDialogState extends State<IssueFormDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titleCtrl;
  late final TextEditingController _descCtrl;
  late final TextEditingController _hoursCtrl;

  int? _projectId;
  late int _type;
  late int _status;
  late int _priority;
  int? _assignedUserId;
  bool _saving = false;

  bool get isEditing => widget.issue != null;

  @override
  void initState() {
    super.initState();
    final issue = widget.issue;
    _titleCtrl = TextEditingController(text: issue?.title);
    _descCtrl = TextEditingController(text: issue?.description);
    _hoursCtrl = TextEditingController(
      text: issue?.estimatedHours?.toString() ?? '',
    );
    _projectId = issue?.projectId ?? widget.projects.firstOrNull?.id;
    _type = issue?.type ?? IssueType.task.value;
    _status = issue?.status ?? IssueStatus.toDo.value;
    _priority = issue?.priority ?? IssuePriority.medium.value;
    _assignedUserId = issue?.assignedUserId;
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    _hoursCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final cubit = context.read<IssueCubit>();
    if (isEditing) {
      await cubit.updateIssue(
        widget.issue!.id,
        projectId: _projectId,
        title: _titleCtrl.text.trim(),
        description: _descCtrl.text.trim().isEmpty
            ? null
            : _descCtrl.text.trim(),
        status: _status,
        priority: _priority,
        estimatedHours: double.tryParse(_hoursCtrl.text),
        assignedUserId: _assignedUserId,
      );
    } else {
      if (_projectId == null) return;
      await cubit.createIssue(
        projectId: _projectId!,
        title: _titleCtrl.text.trim(),
        type: _type,
        status: _status,
        priority: _priority,
        description: _descCtrl.text.trim().isEmpty
            ? null
            : _descCtrl.text.trim(),
        estimatedHours: double.tryParse(_hoursCtrl.text),
        assignedUserId: _assignedUserId,
      );
    }
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(isEditing ? 'Editar issue' : 'Nuevo issue'),
      content: SizedBox(
        width: 480,
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (widget.projects.isNotEmpty)
                  DropdownButtonFormField<int>(
                    value: _projectId,
                    decoration: const InputDecoration(
                      labelText: 'Proyecto',
                      prefixIcon: Icon(Icons.folder_outlined),
                      border: OutlineInputBorder(),
                    ),
                    items: widget.projects
                        .map(
                          (p) => DropdownMenuItem(
                            value: p.id,
                            child: Text(p.name),
                          ),
                        )
                        .toList(),
                    onChanged: (v) => setState(() => _projectId = v),
                    validator: (v) =>
                        !isEditing && v == null ? 'Requerido' : null,
                  ),
                if (widget.projects.isNotEmpty) const SizedBox(height: 16),
                TextFormField(
                  controller: _titleCtrl,
                  autofocus: true,
                  decoration: const InputDecoration(
                    labelText: 'Título',
                    prefixIcon: Icon(Icons.title),
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) =>
                      (v == null || v.trim().isEmpty) ? 'Requerido' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _descCtrl,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Descripción (opcional)',
                    prefixIcon: Icon(Icons.notes),
                    border: OutlineInputBorder(),
                    alignLabelWithHint: true,
                  ),
                ),
                const SizedBox(height: 16),
                if (widget.companyUsers.isNotEmpty)
                  DropdownButtonFormField<int>(
                    value: _assignedUserId,
                    decoration: const InputDecoration(
                      labelText: 'Asignar a (opcional)',
                      prefixIcon: Icon(Icons.person),
                      border: OutlineInputBorder(),
                    ),
                    items: [
                      const DropdownMenuItem(
                        value: null,
                        child: Text('Sin asignar'),
                      ),
                      ...widget.companyUsers.map(
                        (u) => DropdownMenuItem(
                          value: u.userId,
                          child: Text(u.userName),
                        ),
                      ),
                    ],
                    onChanged: (v) => setState(() => _assignedUserId = v),
                  ),
                if (widget.companyUsers.isNotEmpty) const SizedBox(height: 16),
                Row(
                  children: [
                    if (!isEditing)
                      Expanded(
                        child: DropdownButtonFormField<int>(
                          value: _type,
                          decoration: const InputDecoration(
                            labelText: 'Tipo',
                            border: OutlineInputBorder(),
                            contentPadding: EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                          ),
                          items: IssueType.values
                              .map(
                                (t) => DropdownMenuItem(
                                  value: t.value,
                                  child: Text(t.label),
                                ),
                              )
                              .toList(),
                          onChanged: (v) => setState(() => _type = v!),
                        ),
                      ),
                    if (!isEditing) const SizedBox(width: 12),
                    Expanded(
                      child: DropdownButtonFormField<int>(
                        value: _status,
                        decoration: const InputDecoration(
                          labelText: 'Estado',
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                        ),
                        items: IssueStatus.values
                            .map(
                              (s) => DropdownMenuItem(
                                value: s.value,
                                child: Text(s.label),
                              ),
                            )
                            .toList(),
                        onChanged: (v) => setState(() => _status = v!),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<int>(
                        value: _priority,
                        decoration: const InputDecoration(
                          labelText: 'Prioridad',
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                        ),
                        items: IssuePriority.values
                            .map(
                              (p) => DropdownMenuItem(
                                value: p.value,
                                child: Text(p.label),
                              ),
                            )
                            .toList(),
                        onChanged: (v) => setState(() => _priority = v!),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _hoursCtrl,
                        keyboardType: const TextInputType.numberWithOptions(
                          decimal: true,
                        ),
                        decoration: const InputDecoration(
                          labelText: 'Horas estimadas',
                          prefixIcon: Icon(Icons.timer_outlined),
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) {
                          if (v != null && v.isNotEmpty) {
                            if (double.tryParse(v) == null) {
                              return 'Número inválido';
                            }
                          }
                          return null;
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
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
