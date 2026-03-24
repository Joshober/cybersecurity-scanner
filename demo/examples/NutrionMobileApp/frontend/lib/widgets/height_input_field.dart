import 'package:flutter/material.dart';

/// Height input field that supports both cm and feet/inches
class HeightInputField extends StatefulWidget {
  final TextEditingController controller;
  final String? Function(String?)? validator;
  final String? label;
  final IconData? prefixIcon;

  const HeightInputField({
    super.key,
    required this.controller,
    this.validator,
    this.label,
    this.prefixIcon,
  });

  @override
  State<HeightInputField> createState() => _HeightInputFieldState();
}

class _HeightInputFieldState extends State<HeightInputField> {
  bool _useFeetInches = false;
  final TextEditingController _feetController = TextEditingController();
  final TextEditingController _inchesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Check if current value is in feet/inches format (e.g., "5'10\"")
    final currentValue = widget.controller.text;
    if (currentValue.contains("'") || currentValue.contains('"')) {
      _parseFeetInches(currentValue);
      _useFeetInches = true;
    }
  }

  void _parseFeetInches(String value) {
    // Parse format like "5'10\"" or "5'10" or "5 10"
    final regex = RegExp(r"(\d+)[\s']*(\d+)?");
    final match = regex.firstMatch(value);
    if (match != null) {
      _feetController.text = match.group(1) ?? '';
      _inchesController.text = match.group(2) ?? '';
    }
  }

  String _convertToCm(String feet, String inches) {
    final feetValue = int.tryParse(feet) ?? 0;
    final inchesValue = int.tryParse(inches) ?? 0;
    final totalInches = (feetValue * 12) + inchesValue;
    final cm = (totalInches * 2.54).round();
    return cm.toString();
  }

  String? _convertFromCm(String cm) {
    final cmValue = double.tryParse(cm);
    if (cmValue == null) return null;
    final totalInches = cmValue / 2.54;
    final feet = (totalInches / 12).floor();
    final inches = (totalInches % 12).round();
    return "$feet'$inches\"";
  }

  void _updateHeight() {
    if (_useFeetInches) {
      final cm = _convertToCm(_feetController.text, _inchesController.text);
      widget.controller.text = cm;
    }
    // If using cm, controller is already updated
  }

  @override
  void dispose() {
    _feetController.dispose();
    _inchesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: widget.label != null
                  ? Text(
                      widget.label!,
                      style: Theme.of(context).inputDecorationTheme.labelStyle,
                    )
                  : const SizedBox.shrink(),
            ),
            TextButton.icon(
              onPressed: () {
                setState(() {
                  _useFeetInches = !_useFeetInches;
                  if (_useFeetInches && widget.controller.text.isNotEmpty) {
                    // Convert cm to feet/inches
                    final converted = _convertFromCm(widget.controller.text);
                    if (converted != null) {
                      _parseFeetInches(converted);
                    }
                  } else if (!_useFeetInches) {
                    // Convert feet/inches to cm
                    _updateHeight();
                  }
                });
              },
              icon: Icon(
                _useFeetInches ? Icons.straighten : Icons.height,
                size: 16,
              ),
              label: Text(_useFeetInches ? 'Switch to cm' : 'Switch to ft/in'),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (_useFeetInches)
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _feetController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: 'Feet',
                    prefixIcon: widget.prefixIcon != null
                        ? Icon(widget.prefixIcon)
                        : null,
                    border: const OutlineInputBorder(),
                  ),
                  onChanged: (_) => _updateHeight(),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: _inchesController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Inches',
                    border: OutlineInputBorder(),
                  ),
                  onChanged: (_) => _updateHeight(),
                ),
              ),
            ],
          )
        else
          TextFormField(
            controller: widget.controller,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              labelText: widget.label ?? 'Height (cm)',
              prefixIcon: widget.prefixIcon != null
                  ? Icon(widget.prefixIcon)
                  : null,
              border: const OutlineInputBorder(),
            ),
            validator: widget.validator,
          ),
      ],
    );
  }
}

