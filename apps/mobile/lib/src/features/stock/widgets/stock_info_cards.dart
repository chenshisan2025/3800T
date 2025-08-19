import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/stock_model.dart';

class StockInfoCards extends ConsumerWidget {
  const StockInfoCards({
    super.key,
    required this.stock,
  });
  
  final StockModel stock;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _FundamentalCard(stock: stock),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _NewsCard(symbol: stock.symbol),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _FinancialCard(stock: stock),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _TechnicalCard(symbol: stock.symbol),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// 基本面卡片
class _FundamentalCard extends StatelessWidget {
  const _FundamentalCard({required this.stock});
  
  final StockModel stock;

  @override
  Widget build(BuildContext context) {
    return _InfoCard(
      title: '基本面',
      icon: Icons.analytics_outlined,
      iconColor: Colors.blue,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _InfoRow('市值', _formatMarketCap(stock.marketCap)),
          _InfoRow('市盈率', '${stock.peRatio.toStringAsFixed(2)}'),
          _InfoRow('市净率', '${stock.pbRatio.toStringAsFixed(2)}'),
          _InfoRow('成交量', _formatVolume(stock.volume)),
        ],
      ),
    );
  }
  
  String _formatMarketCap(double marketCap) {
    if (marketCap >= 1e12) {
      return '${(marketCap / 1e12).toStringAsFixed(2)}万亿';
    } else if (marketCap >= 1e8) {
      return '${(marketCap / 1e8).toStringAsFixed(2)}亿';
    } else {
      return '${(marketCap / 1e4).toStringAsFixed(2)}万';
    }
  }
  
  String _formatVolume(int volume) {
    if (volume >= 1e8) {
      return '${(volume / 1e8).toStringAsFixed(2)}亿';
    } else if (volume >= 1e4) {
      return '${(volume / 1e4).toStringAsFixed(2)}万';
    } else {
      return volume.toString();
    }
  }
}

// 新闻卡片
class _NewsCard extends StatelessWidget {
  const _NewsCard({required this.symbol});
  
  final String symbol;

  @override
  Widget build(BuildContext context) {
    return _InfoCard(
      title: '新闻',
      icon: Icons.article_outlined,
      iconColor: Colors.orange,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _NewsItem(
            title: '公司发布Q3财报',
            time: '2小时前',
            isPositive: true,
          ),
          const SizedBox(height: 8),
          _NewsItem(
            title: '行业政策利好',
            time: '5小时前',
            isPositive: true,
          ),
          const SizedBox(height: 8),
          _NewsItem(
            title: '市场波动加剧',
            time: '1天前',
            isPositive: false,
          ),
        ],
      ),
    );
  }
}

class _NewsItem extends StatelessWidget {
  const _NewsItem({
    required this.title,
    required this.time,
    required this.isPositive,
  });
  
  final String title;
  final String time;
  final bool isPositive;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 4,
          height: 4,
          decoration: BoxDecoration(
            color: isPositive ? Colors.red : Colors.green,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              Text(
                time,
                style: TextStyle(
                  fontSize: 10,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// 财务数据卡片
class _FinancialCard extends StatelessWidget {
  const _FinancialCard({required this.stock});
  
  final StockModel stock;

  @override
  Widget build(BuildContext context) {
    return _InfoCard(
      title: '财务',
      icon: Icons.account_balance_outlined,
      iconColor: Colors.green,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _InfoRow('营收增长', '+12.5%'),
          _InfoRow('净利润率', '15.2%'),
          _InfoRow('ROE', '18.6%'),
          _InfoRow('负债率', '32.1%'),
        ],
      ),
    );
  }
}

// 技术分析卡片
class _TechnicalCard extends StatelessWidget {
  const _TechnicalCard({required this.symbol});
  
  final String symbol;

  @override
  Widget build(BuildContext context) {
    return _InfoCard(
      title: '技术面',
      icon: Icons.trending_up_outlined,
      iconColor: Colors.purple,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _TechnicalIndicator('RSI', 65.2, Colors.orange),
          _TechnicalIndicator('MACD', 0.85, Colors.red),
          _TechnicalIndicator('KDJ', 72.1, Colors.blue),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.red.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text(
              '多头趋势',
              style: TextStyle(
                fontSize: 10,
                color: Colors.red,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TechnicalIndicator extends StatelessWidget {
  const _TechnicalIndicator(
    this.name,
    this.value,
    this.color,
  );
  
  final String name;
  final double value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            name,
            style: const TextStyle(
              fontSize: 11,
              color: Colors.grey,
            ),
          ),
          Text(
            value.toStringAsFixed(1),
            style: TextStyle(
              fontSize: 11,
              color: color,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

// 通用信息卡片
class _InfoCard extends StatelessWidget {
  const _InfoCard({
    required this.title,
    required this.icon,
    required this.iconColor,
    required this.child,
  });
  
  final String title;
  final IconData icon;
  final Color iconColor;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
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
          Row(
            children: [
              Icon(
                icon,
                size: 16,
                color: iconColor,
              ),
              const SizedBox(width: 6),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

// 通用信息行
class _InfoRow extends StatelessWidget {
  const _InfoRow(this.label, this.value);
  
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: Colors.grey[600],
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}