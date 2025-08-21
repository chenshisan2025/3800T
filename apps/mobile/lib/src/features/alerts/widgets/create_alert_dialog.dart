import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/alert_model.dart';
import '../providers/alert_provider.dart';
import '../../stock/models/stock_model.dart';
import '../../stock/providers/stock_provider.dart';

class CreateAlertDialog extends ConsumerStatefulWidget {
  final AlertItem? alert; // 编辑模式时传入

  const CreateAlertDialog({super.key, this.alert});

  @override
  ConsumerState<CreateAlertDialog> createState() => _CreateAlertDialogState();
}

class _CreateAlertDialogState extends ConsumerState<CreateAlertDialog> {
  final _formKey = GlobalKey<FormState>();
  final _symbolController = TextEditingController();
  final _targetPriceController = TextEditingController();
  final _noteController = TextEditingController();
  
  AlertType _selectedType = AlertType.priceUp;
  bool _isLoading = false;
  StockModel? _selectedStock;
  String? _symbolError;

  @override
  void initState() {
    super.initState();
    if (widget.alert != null) {
      _initializeForEdit();
    }
  }

  void _initializeForEdit() {
    final alert = widget.alert!;
    _symbolController.text = alert.symbol;
    _targetPriceController.text = alert.targetPrice.toString();
    _noteController.text = alert.note ?? '';
    _selectedType = alert.type;
    
    // 创建股票信息对象
    _selectedStock = StockModel(
      symbol: alert.symbol,
      name: alert.name,
      currentPrice: alert.currentPrice,
      change: 0,
      changePercent: 0,
      open: alert.currentPrice,
      high: alert.currentPrice,
      low: alert.currentPrice,
      previousClose: alert.currentPrice,
      volume: 0,
      marketCap: 0,
      pe: 0,
      pb: 0,
      updateTime: DateTime.now().toIso8601String(),
    );
  }

  @override
  void dispose() {
    _symbolController.dispose();
    _targetPriceController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.alert != null ? '编辑提醒' : '创建提醒'),
      content: SizedBox(
        width: double.maxFinite,
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 股票代码输入
              TextFormField(
                controller: _symbolController,
                decoration: InputDecoration(
                  labelText: '股票代码',
                  hintText: '请输入股票代码，如 AAPL',
                  errorText: _symbolError,
                  suffixIcon: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : IconButton(
                          icon: const Icon(Icons.search),
                          onPressed: _searchStock,
                        ),
                ),
                textCapitalization: TextCapitalization.characters,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return '请输入股票代码';
                  }
                  return null;
                },
                onChanged: (value) {
                  setState(() {
                    _symbolError = null;
                    _selectedStock = null;
                  });
                },
                onFieldSubmitted: (_) => _searchStock(),
              ),
              
              // 股票信息显示
              if (_selectedStock != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _selectedStock!.name,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Text(
                            '当前价格: ',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          Text(
                            '\$${_selectedStock!.currentPrice.toStringAsFixed(2)}',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
              
              const SizedBox(height: 16),
              
              // 提醒类型选择
              Text(
                '提醒类型',
                style: Theme.of(context).textTheme.titleSmall,
              ),
              const SizedBox(height: 8),
              ...AlertType.values.map((type) => RadioListTile<AlertType>(
                title: Text(type.displayName),
                subtitle: Text(
                  type.description,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                value: type,
                groupValue: _selectedType,
                onChanged: (value) {
                  setState(() {
                    _selectedType = value!;
                  });
                },
                contentPadding: EdgeInsets.zero,
              )),
              
              const SizedBox(height: 16),
              
              // 目标价格输入
              TextFormField(
                controller: _targetPriceController,
                decoration: InputDecoration(
                  labelText: _getTargetPriceLabel(),
                  hintText: _getTargetPriceHint(),
                  prefixText: _selectedType == AlertType.priceUp || _selectedType == AlertType.priceDown ? '\$' : '',
                  suffixText: _selectedType == AlertType.changeUp || _selectedType == AlertType.changeDown ? '%' : '',
                ),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d*')),
                ],
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return '请输入目标值';
                  }
                  final price = double.tryParse(value);
                  if (price == null || price <= 0) {
                    return '请输入有效的数值';
                  }
                  return null;
                },
              ),
              
              const SizedBox(height: 16),
              
              // 备注输入
              TextFormField(
                controller: _noteController,
                decoration: const InputDecoration(
                  labelText: '备注（可选）',
                  hintText: '添加备注信息',
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
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('取消'),
        ),
        ElevatedButton(
          onPressed: _isLoading ? null : _handleSubmit,
          child: _isLoading
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : Text(widget.alert != null ? '更新' : '创建'),
        ),
      ],
    );
  }

  String _getTargetPriceLabel() {
    switch (_selectedType) {
      case AlertType.priceUp:
        return '目标价格（上涨至）';
      case AlertType.priceDown:
        return '目标价格（下跌至）';
      case AlertType.changeUp:
        return '涨幅目标';
      case AlertType.changeDown:
        return '跌幅目标';
    }
  }

  String _getTargetPriceHint() {
    switch (_selectedType) {
      case AlertType.priceUp:
        return '如 150.00';
      case AlertType.priceDown:
        return '如 120.00';
      case AlertType.changeUp:
        return '如 5.0';
      case AlertType.changeDown:
        return '如 -3.0';
    }
  }

  Future<void> _searchStock() async {
    final symbol = _symbolController.text.trim().toUpperCase();
    if (symbol.isEmpty) return;

    setState(() {
      _isLoading = true;
      _symbolError = null;
    });

    try {
      final stockService = ref.read(stockServiceProvider);
      final stock = await stockService.getStockDetail(symbol);
      
      setState(() {
        _selectedStock = stock;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _symbolError = '未找到该股票，请检查代码是否正确';
        _selectedStock = null;
        _isLoading = false;
      });
    }
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedStock == null) {
      setState(() {
        _symbolError = '请先搜索并选择股票';
      });
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final alertNotifier = ref.read(alertProvider.notifier);
      final targetPrice = double.parse(_targetPriceController.text);
      
      if (widget.alert != null) {
        // 编辑模式
        final updatedAlert = widget.alert!.copyWith(
          type: _selectedType,
          targetPrice: targetPrice,
          note: _noteController.text.trim().isEmpty ? null : _noteController.text.trim(),
        );
        await alertNotifier.updateAlert(updatedAlert);
      } else {
        // 创建模式
        await alertNotifier.createAlert(
          symbol: _selectedStock!.symbol,
          name: _selectedStock!.name,
          type: _selectedType,
          targetPrice: targetPrice,
          currentPrice: _selectedStock!.currentPrice,
          note: _noteController.text.trim().isEmpty ? null : _noteController.text.trim(),
        );
      }
      
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(widget.alert != null ? '提醒已更新' : '提醒已创建'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('操作失败: $e'),
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