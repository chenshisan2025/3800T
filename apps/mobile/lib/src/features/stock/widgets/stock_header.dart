import 'package:flutter/material.dart';

import '../models/stock_model.dart';

class StockHeader extends StatelessWidget {
  const StockHeader({super.key, required this.stock});
  
  final StockModel stock;

  @override
  Widget build(BuildContext context) {
    final isPositive = stock.change >= 0;
    final changeColor = isPositive ? Colors.red : Colors.green; // 红涨绿跌
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 股票名称和代码
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      stock.name,
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      stock.symbol,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              // 更新时间
              Text(
                _formatUpdateTime(stock.updateTime),
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.grey[500],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // 价格信息
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // 当前价格
              Text(
                '¥${stock.currentPrice.toStringAsFixed(2)}',
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                  color: changeColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 32,
                ),
              ),
              
              const SizedBox(width: 16),
              
              // 涨跌信息
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: changeColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '${isPositive ? '+' : ''}${stock.change.toStringAsFixed(2)}',
                        style: TextStyle(
                          color: changeColor,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: changeColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '${isPositive ? '+' : ''}${stock.changePercent.toStringAsFixed(2)}%',
                        style: TextStyle(
                          color: changeColor,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // 基本数据
          Row(
            children: [
              Expanded(
                child: _buildDataItem(context, '开盘', '¥${stock.open.toStringAsFixed(2)}'),
              ),
              Expanded(
                child: _buildDataItem(context, '最高', '¥${stock.high.toStringAsFixed(2)}'),
              ),
              Expanded(
                child: _buildDataItem(context, '最低', '¥${stock.low.toStringAsFixed(2)}'),
              ),
              Expanded(
                child: _buildDataItem(context, '昨收', '¥${stock.previousClose.toStringAsFixed(2)}'),
              ),
            ],
          ),
          
          const SizedBox(height: 12),
          
          Row(
            children: [
              Expanded(
                child: _buildDataItem(context, '成交量', _formatVolume(stock.volume)),
              ),
              Expanded(
                child: _buildDataItem(context, '市值', _formatMarketCap(stock.marketCap)),
              ),
              Expanded(
                child: _buildDataItem(context, 'P/E', stock.pe.toStringAsFixed(2)),
              ),
              Expanded(
                child: _buildDataItem(context, 'P/B', stock.pb.toStringAsFixed(2)),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildDataItem(BuildContext context, String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: Colors.grey[600],
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
  
  String _formatUpdateTime(String updateTime) {
    try {
      final time = DateTime.parse(updateTime);
      final now = DateTime.now();
      final diff = now.difference(time);
      
      if (diff.inMinutes < 1) {
        return '刚刚更新';
      } else if (diff.inMinutes < 60) {
        return '${diff.inMinutes}分钟前';
      } else if (diff.inHours < 24) {
        return '${diff.inHours}小时前';
      } else {
        return '${time.month}/${time.day} ${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
      }
    } catch (e) {
      return '更新时间';
    }
  }
  
  String _formatVolume(int volume) {
    if (volume >= 100000000) {
      return '${(volume / 100000000).toStringAsFixed(1)}亿';
    } else if (volume >= 10000) {
      return '${(volume / 10000).toStringAsFixed(1)}万';
    } else {
      return volume.toString();
    }
  }
  
  String _formatMarketCap(double marketCap) {
    if (marketCap >= 100000000) {
      return '${(marketCap / 100000000).toStringAsFixed(1)}亿';
    } else if (marketCap >= 10000) {
      return '${(marketCap / 10000).toStringAsFixed(1)}万';
    } else {
      return marketCap.toStringAsFixed(0);
    }
  }
}