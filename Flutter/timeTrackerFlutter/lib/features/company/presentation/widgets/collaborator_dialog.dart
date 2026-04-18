import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/enums/user_role.dart';
import '../../../../core/models/company.dart';
import '../../bloc/company_cubit.dart';

class AddCollaboratorDialog extends StatefulWidget {
  const AddCollaboratorDialog({
    super.key,
    required this.companyId,
    required this.availableUsers,
  });

  final int companyId;
  final List<AvailableUser> availableUsers;

  @override
  State<AddCollaboratorDialog> createState() => _AddCollaboratorDialogState();
}

class _AddCollaboratorDialogState extends State<AddCollaboratorDialog> {
  final _formKey = GlobalKey<FormState>();
  final _rateCtrl = TextEditingController();
  int? _selectedUserId;
  UserRole _selectedRole = UserRole.developer;
  bool _saving = false;

  @override
  void dispose() {
    _rateCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedUserId == null) return;
    setState(() => _saving = true);
    await context.read<CompanyCubit>().addMember(
          widget.companyId,
          _selectedUserId!,
          _selectedRole.name,
          double.tryParse(_rateCtrl.text),
        );
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Agregar colaborador'),
      content: SizedBox(
        width: 400,
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<int>(
                decoration: const InputDecoration(
                  labelText: 'Usuario',
                  prefixIcon: Icon(Icons.person_search_outlined),
                  border: OutlineInputBorder(),
                ),
                hint: const Text('Seleccionar usuario'),
                initialValue: _selectedUserId,
                items: widget.availableUsers
                    .map((u) => DropdownMenuItem(
                          value: u.id,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(u.name),
                              Text(u.email,
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.copyWith(
                                        color: Theme.of(context)
                                            .colorScheme
                                            .onSurfaceVariant,
                                      )),
                            ],
                          ),
                        ))
                    .toList(),
                onChanged: (v) => setState(() => _selectedUserId = v),
                validator: (v) => v == null ? 'Seleccionar un usuario' : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<UserRole>(
                decoration: const InputDecoration(
                  labelText: 'Rol',
                  prefixIcon: Icon(Icons.badge_outlined),
                  border: OutlineInputBorder(),
                ),
                initialValue: _selectedRole,
                items: [UserRole.admin, UserRole.manager, UserRole.developer]
                    .map((r) => DropdownMenuItem(
                          value: r,
                          child: Row(
                            children: [
                              Icon(r.icon, size: 18, color: r.color),
                              const SizedBox(width: 8),
                              Text(r.label),
                            ],
                          ),
                        ))
                    .toList(),
                onChanged: (v) => setState(() => _selectedRole = v!),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _rateCtrl,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Tarifa por hora (opcional)',
                  prefixIcon: Icon(Icons.attach_money),
                  border: OutlineInputBorder(),
                ),
                validator: (v) {
                  if (v != null && v.isNotEmpty && double.tryParse(v) == null) {
                    return 'Número inválido';
                  }
                  return null;
                },
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
              : const Text('Agregar'),
        ),
      ],
    );
  }
}

class EditCollaboratorDialog extends StatefulWidget {
  const EditCollaboratorDialog({
    super.key,
    required this.companyId,
    required this.member,
  });

  final int companyId;
  final CompanyUser member;

  @override
  State<EditCollaboratorDialog> createState() => _EditCollaboratorDialogState();
}

class _EditCollaboratorDialogState extends State<EditCollaboratorDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _rateCtrl;
  late UserRole _selectedRole;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _selectedRole = widget.member.userRole;
    _rateCtrl = TextEditingController(
      text: widget.member.hourlyRate?.toString() ?? '',
    );
  }

  @override
  void dispose() {
    _rateCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    await context.read<CompanyCubit>().updateMember(
          widget.companyId,
          widget.member.userId,
          _selectedRole.name,
          double.tryParse(_rateCtrl.text),
        );
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Editar: ${widget.member.userName}'),
      content: SizedBox(
        width: 400,
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(child: Text(widget.member.userName[0])),
                title: Text(widget.member.userName),
                subtitle: Text(widget.member.userEmail),
              ),
              const Divider(),
              const SizedBox(height: 8),
              DropdownButtonFormField<UserRole>(
                decoration: const InputDecoration(
                  labelText: 'Rol',
                  prefixIcon: Icon(Icons.badge_outlined),
                  border: OutlineInputBorder(),
                ),
                initialValue: _selectedRole,
                items: [UserRole.admin, UserRole.manager, UserRole.developer]
                    .map((r) => DropdownMenuItem(
                          value: r,
                          child: Row(
                            children: [
                              Icon(r.icon, size: 18, color: r.color),
                              const SizedBox(width: 8),
                              Text(r.label),
                            ],
                          ),
                        ))
                    .toList(),
                onChanged: (v) => setState(() => _selectedRole = v!),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _rateCtrl,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Tarifa por hora',
                  prefixIcon: Icon(Icons.attach_money),
                  border: OutlineInputBorder(),
                ),
                validator: (v) {
                  if (v != null && v.isNotEmpty && double.tryParse(v) == null) {
                    return 'Número inválido';
                  }
                  return null;
                },
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
              : const Text('Guardar'),
        ),
      ],
    );
  }
}
