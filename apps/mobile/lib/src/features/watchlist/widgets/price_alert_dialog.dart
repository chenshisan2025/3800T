import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../../../core/constants/app_strings.dart';
import '../../alerts/models/alert_model.dart';
import '../models/watchlist_model.dart';
import '../providers/watchlist_provider.dart';

class PriceAlertDialog extends ConsumerStatefulWidget {
  final PriceAlert? alert;
  final String? initialSymbol;
  final String? initialName;
  final double? initialPrice;

  const PriceAlertDialog({
    super.key,
    this.alert,
    this.initialSymbol,
    this.initialName,
    this.initialPrice,
  });

  @override
  ConsumerState<PriceAlertDialog> createState() => _PriceAlertDialogState();
}

class _PriceAlertDialogState extends ConsumerState<PriceAlertDialog> {
  final _formKey = GlobalKey<FormState>();
  final _stockSymbolController = TextEditingController();
  final _stockNameController = TextEditingController();
  final _targetPriceController = TextEditingController();
  final _noteController = TextEditingController();
  
  AlertType _selectedType = AlertType.priceUp;
  double? _currentPrice;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    
    if (widget.alert != null) {
      // 编辑模式
      _targetPriceController.text = widget.alert!.targetPrice.toString();
      _noteController.text = widget.alert!.note ?? '';
      _selectedType = widget.alert!.type;
      _currentPrice = widget.alert!.currentPrice;
    } else {
      // 新建模式
      if (widget.initialSymbol != null) {
        _stockSymbolController.text = widget.initialSymbol!;
      }
      if (widget.initialName != null) {
        _stockNameController.text = widget.initialName!;
      }
      if (widget.initialPrice != null) {
        _currentPrice = widget.initialPrice;
      }
    }
  }

  @override
  void dispose() {
    _stockSymbolController.dispose();
    _stockNameController.dispose();
    _targetPriceController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.alert != null;
    
    return AlertDialog(
      title: Text(isEditing ? AppStrings.editPriceAlert : AppStrings.setPriceAlert),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 股票信息输入（仅在新建时显示）
              if (!isEditing) ...[
                TextFormField(
                  controller: _stockSymbolController,
                  decoration: const InputDecoration(
                    labelText: AppStrings.stockCode,
                    hintText: AppStrings.enterStockCodeExample,
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return AppStrings.pleaseEnterStockCode;
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _stockNameController,
                  decoration: const InputDecoration(
                    labelText: AppStrings.stockName,
                    hintText: AppStrings.pleaseEnterStockName,
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return AppStrings.pleaseEnterStockName;
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
              ] else ...[
                // 编辑模式显示股票信息
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey[50],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.trending_up,
                        color: Colors.blue[600],
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.alert!.name,
                              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              widget.alert!.symbol,
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],
              // 当前价格显示
              if (_currentPrice != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blue[50],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.info_outline,
                        color: Colors.blue[600],
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${AppStrings.currentPrice}：¥${_currentPrice!.toStringAsFixed(2)}',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.blue[700],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              if (_currentPrice != null) const SizedBox(height: 16),
              // 提醒类型选择
              Text(
                AppStrings.alertType,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: RadioListTile<AlertType>(
                      title: Text(AppStrings.riseToPrice),
                      subtitle: Text(AppStrings.priceRisesToTarget),
                      value: AlertType.priceUp,
                      groupValue: _selectedType,
                      onChanged: (value) {
                        setState(() {
                          _selectedType = value!;
                        });
                      },
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                  Expanded(
                    child: RadioListTile<AlertType>(
                      title: Text(AppStrings.fallToPrice),
                      subtitle: Text(AppStrings.priceFallsToTarget),
                      value: AlertType.priceDown,
                      groupValue: _selectedType,
                      onChanged: (value) {
                        setState(() {
                          _selectedType = value!;
                        });
                      },
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              // 目标价格输入
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextFormField(
                    controller: _targetPriceController,
                    decoration: const InputDecoration(
                      labelText: AppStrings.targetPrice,
                      hintText: AppStrings.pleaseEnterTargetPrice,
                      prefixText: '¥',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d*$')),
                    ],
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return AppStrings.pleaseEnterTargetPrice;
                      }
                      final price = double.tryParse(value);
                      if (price == null || price <= 0) {
                        return AppStrings.pleaseEnterValidPrice;
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 8),
                  // 价格计算器按钮
                  if (_currentPrice != null)
                    Row(
                      children: [
                        TextButton.icon(
                          onPressed: () {
                            final increase = _currentPrice! * 0.1; // 10%涨幅
                            _targetPriceController.text = (_currentPrice! + increase).toStringAsFixed(2);
                          },
                          icon: const Icon(Icons.trending_up, size: 16),
                          label: const Text('+10%'),
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.red,
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                          ),
                        ),
                        TextButton.icon(
                          onPressed: () {
                            final decrease = _currentPrice! * 0.1; // 10%跌幅
                            _targetPriceController.text = (_currentPrice! - decrease).toStringAsFixed(2);
                          },
                          icon: const Icon(Icons.trending_down, size: 16),
                          label: const Text('-10%'),
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.green,
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                          ),
                        ),
                      ],
                    ),
                ],
              ),
              const SizedBox(height: 16),
              
              // 备注输入
              TextFormField(
                controller: _noteController,
                decoration: const InputDecoration(
                  labelText: AppStrings.noteOptional,
                  hintText: AppStrings.addAlertNote,
                  border: OutlineInputBorder(),
                ),
                maxLines: 2,
                maxLength: 100,
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: _isLoading ? null : () => Navigator.of(context).pop(),
          child: const Text(AppStrings.cancel),
        ),
        ElevatedButton(
          onPressed: _isLoading ? null : _handleSubmit,
          child: _isLoading
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : Text(isEditing ? AppStrings.save : AppStrings.confirm),
        ),
      ],
    );
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final targetPrice = double.parse(_targetPriceController.text);
      final note = _noteController.text.trim();
      final isEditing = widget.alert != null;

      if (isEditing) {
        // 编辑现有提醒
        await ref.read(priceAlertsProvider.notifier).removePriceAlert(widget.alert!.id);
        await ref.read(priceAlertsProvider.notifier).addPriceAlert(
          symbol: widget.alert!.symbol,
          name: widget.alert!.name,
          targetPrice: targetPrice,
          currentPrice: widget.alert!.currentPrice,
          type: _selectedType,
          note: note,
        );
      } else {
        // 创建新的价格提醒
        await ref.read(priceAlertsProvider.notifier).addPriceAlert(
          symbol: _stockSymbolController.text.trim(),
          name: _stockNameController.text.trim(),
          targetPrice: targetPrice,
          currentPrice: _currentPrice ?? 0.0,
          type: _selectedType,
          note: note,
        );
      }

      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isEditing ? AppStrings.priceAlertUpdatedSuccess : AppStrings.priceAlertSetSuccess),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${widget.alert != null ? AppStrings.update : AppStrings.set}${AppStrings.failed}：$e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }
}