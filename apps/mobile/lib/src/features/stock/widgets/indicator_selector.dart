import 'package:flutter/material.dart';

import '../models/stock_model.dart';

class IndicatorSelector extends StatelessWidget {
  const IndicatorSelector({
    super.key,
    required this.selectedIndicators,
    required this.onIndicatorsChanged,
  });
  
  final List<IndicatorType> selectedIndicators;
  final ValueChanged<List<IndicatorType>> onIndicatorsChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: Colors.grey.withOpacity(0.2),
            width: 1,
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                '技术指标',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const Spacer(),
              TextButton(
                onPressed: () => _showIndicatorDialog(context),
                child: const Text('设置'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 4,
            children: selectedIndicators.map((indicator) {
              return _IndicatorChip(
                indicator: indicator,
                isSelected: true,
                onTap: () => _removeIndicator(indicator),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
  
  void _showIndicatorDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => _IndicatorDialog(
        selectedIndicators: selectedIndicators,
        onIndicatorsChanged: onIndicatorsChanged,
      ),
    );
  }
  
  void _removeIndicator(IndicatorType indicator) {
    final newIndicators = List<IndicatorType>.from(selectedIndicators)
      ..remove(indicator);
    onIndicatorsChanged(newIndicators);
  }
}

class _IndicatorChip extends StatelessWidget {
  const _IndicatorChip({
    required this.indicator,
    required this.isSelected,
    required this.onTap,
  });
  
  final IndicatorType indicator;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected 
              ? Theme.of(context).primaryColor.withOpacity(0.1)
              : Colors.grey.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected 
                ? Theme.of(context).primaryColor
                : Colors.grey.withOpacity(0.3),
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: indicator.color,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 4),
            Text(
              indicator.displayName,
              style: TextStyle(
                fontSize: 12,
                color: isSelected 
                    ? Theme.of(context).primaryColor
                    : Colors.grey[600],
                fontWeight: isSelected ? FontWeight.w500 : FontWeight.normal,
              ),
            ),
            if (isSelected) ...[
              const SizedBox(width: 4),
              Icon(
                Icons.close,
                size: 12,
                color: Theme.of(context).primaryColor,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _IndicatorDialog extends StatefulWidget {
  const _IndicatorDialog({
    required this.selectedIndicators,
    required this.onIndicatorsChanged,
  });
  
  final List<IndicatorType> selectedIndicators;
  final ValueChanged<List<IndicatorType>> onIndicatorsChanged;

  @override
  State<_IndicatorDialog> createState() => _IndicatorDialogState();
}

class _IndicatorDialogState extends State<_IndicatorDialog> {
  late List<IndicatorType> _tempSelectedIndicators;
  
  @override
  void initState() {
    super.initState();
    _tempSelectedIndicators = List.from(widget.selectedIndicators);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('选择技术指标'),
      content: SizedBox(
        width: double.maxFinite,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildIndicatorGroup('移动平均线', [
              IndicatorType.ma5,
              IndicatorType.ma10,
              IndicatorType.ma20,
              IndicatorType.ma60,
            ]),
            const SizedBox(height: 16),
            _buildIndicatorGroup('技术指标', [
              IndicatorType.macd,
              IndicatorType.kdj,
              IndicatorType.rsi,
            ]),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('取消'),
        ),
        TextButton(
          onPressed: () {
            widget.onIndicatorsChanged(_tempSelectedIndicators);
            Navigator.of(context).pop();
          },
          child: const Text('确定'),
        ),
      ],
    );
  }
  
  Widget _buildIndicatorGroup(String title, List<IndicatorType> indicators) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: indicators.map((indicator) {
            final isSelected = _tempSelectedIndicators.contains(indicator);
            return GestureDetector(
              onTap: () {
                setState(() {
                  if (isSelected) {
                    _tempSelectedIndicators.remove(indicator);
                  } else {
                    _tempSelectedIndicators.add(indicator);
                  }
                });
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected 
                      ? Theme.of(context).primaryColor.withOpacity(0.1)
                      : Colors.grey.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isSelected 
                        ? Theme.of(context).primaryColor
                        : Colors.grey.withOpacity(0.3),
                    width: 1,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: indicator.color,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      indicator.displayName,
                      style: TextStyle(
                        fontSize: 13,
                        color: isSelected 
                            ? Theme.of(context).primaryColor
                            : Colors.grey[700],
                        fontWeight: isSelected ? FontWeight.w500 : FontWeight.normal,
                      ),
                    ),
                    if (isSelected) ...[
                      const SizedBox(width: 4),
                      Icon(
                        Icons.check,
                        size: 14,
                        color: Theme.of(context).primaryColor,
                      ),
                    ],
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}