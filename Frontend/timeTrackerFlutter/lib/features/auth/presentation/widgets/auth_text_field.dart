import 'package:flutter/material.dart';

class AuthTextField extends StatefulWidget {
  const AuthTextField({
    required this.label,
    required this.controller,
    super.key,
    this.hint,
    this.obscure = false,
    this.keyboardType = TextInputType.text,
    this.textInputAction = TextInputAction.next,
    this.prefixIcon,
    this.validator,
    this.onFieldSubmitted,
    this.autofillHints,
  });

  final String label;
  final String? hint;
  final TextEditingController controller;
  final bool obscure;
  final TextInputType keyboardType;
  final TextInputAction textInputAction;
  final IconData? prefixIcon;
  final String? Function(String?)? validator;
  final void Function(String)? onFieldSubmitted;
  final Iterable<String>? autofillHints;

  @override
  State<AuthTextField> createState() => _AuthTextFieldState();
}

class _AuthTextFieldState extends State<AuthTextField> {
  late bool _obscured;

  @override
  void initState() {
    super.initState();
    _obscured = widget.obscure;
  }

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: widget.controller,
      obscureText: _obscured,
      keyboardType: widget.keyboardType,
      textInputAction: widget.textInputAction,
      autofillHints: widget.autofillHints,
      validator: widget.validator,
      onFieldSubmitted: widget.onFieldSubmitted,
      decoration: InputDecoration(
        labelText: widget.label,
        hintText: widget.hint,
        prefixIcon: widget.prefixIcon != null ? Icon(widget.prefixIcon) : null,
        suffixIcon: widget.obscure
            ? IconButton(
                icon: Icon(
                  _obscured ? Icons.visibility_off : Icons.visibility,
                ),
                tooltip: _obscured ? 'Mostrar contraseña' : 'Ocultar contraseña',
                onPressed: () => setState(() => _obscured = !_obscured),
              )
            : null,
        border: const OutlineInputBorder(),
      ),
    );
  }
}
