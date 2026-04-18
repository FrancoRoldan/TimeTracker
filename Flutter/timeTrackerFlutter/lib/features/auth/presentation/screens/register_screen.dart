import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_router.dart';
import '../../bloc/auth_cubit.dart';
import '../../bloc/auth_state.dart';
import '../widgets/auth_text_field.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  final _companyIdCtrl = TextEditingController();
  String? _apiError;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    _companyIdCtrl.dispose();
    super.dispose();
  }

  void _submit() {
    setState(() => _apiError = null);
    if (!_formKey.currentState!.validate()) return;
    final companyId = int.tryParse(_companyIdCtrl.text.trim()) ?? 0;
    context.read<AuthCubit>().register(
          name: _nameCtrl.text.trim(),
          email: _emailCtrl.text.trim(),
          password: _passwordCtrl.text,
          companyId: companyId,
        );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Crear cuenta'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go(AppRoutes.login),
        ),
      ),
      body: BlocConsumer<AuthCubit, AuthState>(
        listener: (context, state) {
          if (state is AuthAuthenticated) {
            context.go(AppRoutes.projects);
          } else if (state is AuthError) {
            setState(() => _apiError = state.message);
          } else if (state is AuthLoading) {
            setState(() => _apiError = null);
          }
        },
        builder: (context, state) {
          final isLoading = state is AuthLoading;

          return SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // ── Encabezado ────────────────────────────────────
                      Text(
                        'Creá tu cuenta',
                        style: Theme.of(context)
                            .textTheme
                            .headlineSmall
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Completá los datos para registrarte',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Theme.of(context)
                                  .colorScheme
                                  .onSurfaceVariant,
                            ),
                      ),
                      const SizedBox(height: 32),

                      // ── Formulario ────────────────────────────────────
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Form(
                            key: _formKey,
                            child: AutofillGroup(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  // Nombre
                                  AuthTextField(
                                    label: 'Nombre completo',
                                    controller: _nameCtrl,
                                    prefixIcon: Icons.person_outline,
                                    autofillHints: const [AutofillHints.name],
                                    validator: (v) {
                                      if (v == null || v.trim().isEmpty) {
                                        return 'Ingresá tu nombre';
                                      }
                                      if (v.trim().length < 2) {
                                        return 'El nombre es muy corto';
                                      }
                                      return null;
                                    },
                                  ),
                                  const SizedBox(height: 16),

                                  // Email
                                  AuthTextField(
                                    label: 'Email',
                                    controller: _emailCtrl,
                                    keyboardType: TextInputType.emailAddress,
                                    prefixIcon: Icons.email_outlined,
                                    autofillHints: const [
                                      AutofillHints.newUsername
                                    ],
                                    validator: (v) {
                                      if (v == null || v.trim().isEmpty) {
                                        return 'Ingresá tu email';
                                      }
                                      if (!v.contains('@') ||
                                          !v.contains('.')) {
                                        return 'Email inválido';
                                      }
                                      return null;
                                    },
                                  ),
                                  const SizedBox(height: 16),

                                  // Contraseña
                                  AuthTextField(
                                    label: 'Contraseña',
                                    controller: _passwordCtrl,
                                    obscure: true,
                                    prefixIcon: Icons.lock_outline,
                                    autofillHints: const [
                                      AutofillHints.newPassword
                                    ],
                                    validator: (v) {
                                      if (v == null || v.isEmpty) {
                                        return 'Ingresá una contraseña';
                                      }
                                      if (v.length < 8) {
                                        return 'Mínimo 8 caracteres';
                                      }
                                      return null;
                                    },
                                  ),
                                  const SizedBox(height: 16),

                                  // Confirmar contraseña
                                  AuthTextField(
                                    label: 'Confirmar contraseña',
                                    controller: _confirmCtrl,
                                    obscure: true,
                                    prefixIcon: Icons.lock_outline,
                                    autofillHints: const [
                                      AutofillHints.newPassword
                                    ],
                                    validator: (v) {
                                      if (v == null || v.isEmpty) {
                                        return 'Confirmá la contraseña';
                                      }
                                      if (v != _passwordCtrl.text) {
                                        return 'Las contraseñas no coinciden';
                                      }
                                      return null;
                                    },
                                  ),
                                  const SizedBox(height: 16),

                                  // Divider con texto
                                  const Row(
                                    children: [
                                      Expanded(child: Divider()),
                                      Padding(
                                        padding: EdgeInsets.symmetric(
                                            horizontal: 12),
                                        child: Text('Empresa'),
                                      ),
                                      Expanded(child: Divider()),
                                    ],
                                  ),
                                  const SizedBox(height: 16),

                                  // ID de empresa
                                  AuthTextField(
                                    label: 'ID de empresa',
                                    hint: 'Ej: 1  (dejá vacío si no tenés)',
                                    controller: _companyIdCtrl,
                                    keyboardType: TextInputType.number,
                                    prefixIcon: Icons.business_outlined,
                                    textInputAction: TextInputAction.done,
                                    onFieldSubmitted: (_) => _submit(),
                                    validator: (v) {
                                      if (v != null &&
                                          v.isNotEmpty &&
                                          int.tryParse(v) == null) {
                                        return 'Debe ser un número';
                                      }
                                      return null;
                                    },
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Si no tenés empresa, registrate con ID vacío '
                                    'y creá una desde el panel principal.',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodySmall
                                        ?.copyWith(
                                          color: Theme.of(context)
                                              .colorScheme
                                              .onSurfaceVariant,
                                        ),
                                  ),
                                  if (_apiError != null) ...[
                                    const SizedBox(height: 16),
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: Theme.of(context)
                                            .colorScheme
                                            .errorContainer,
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Row(
                                        children: [
                                          Icon(
                                            Icons.error_outline,
                                            size: 18,
                                            color: Theme.of(context)
                                                .colorScheme
                                                .onErrorContainer,
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              _apiError!,
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall
                                                  ?.copyWith(
                                                    color: Theme.of(context)
                                                        .colorScheme
                                                        .onErrorContainer,
                                                  ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                  const SizedBox(height: 24),

                                  // Botón
                                  FilledButton(
                                    onPressed: isLoading ? null : _submit,
                                    child: isLoading
                                        ? const SizedBox(
                                            height: 20,
                                            width: 20,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                            ),
                                          )
                                        : const Text('Crear cuenta'),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),

                      // ── Link al login ─────────────────────────────────
                      const SizedBox(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            '¿Ya tenés cuenta?',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          TextButton(
                            onPressed: isLoading
                                ? null
                                : () => context.go(AppRoutes.login),
                            child: const Text('Iniciá sesión'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
