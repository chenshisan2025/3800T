import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_strings.dart';

class MarketPage extends StatelessWidget {
  const MarketPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(AppStrings.market),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              // TODO: 实现搜索功能
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          // TODO: 实现下拉刷新
          await Future.delayed(const Duration(seconds: 1));
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // 市场概览卡片
            _buildMarketOverviewCard(),
            const SizedBox(height: 16),
            
            // 热门股票列表
            _buildSectionTitle(AppStrings.hotStocks),
            const SizedBox(height: 8),
            _buildStockList(context),
            
            const SizedBox(height: 16),
            
            // 涨跌榜
            _buildSectionTitle(AppStrings.gainersLosers),
            const SizedBox(height: 8),
            _buildGainersLosersList(context),
          ],
        ),
      ),
    );
  }

  Widget _buildMarketOverviewCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              AppStrings.marketOverview,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildMarketIndexItem(AppStrings.shanghaiIndex, '3,234.56', '+1.23%', true),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildMarketIndexItem(AppStrings.shenzhenIndex, '12,345.67', '-0.45%', false),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildMarketIndexItem(AppStrings.chinextIndex, '2,456.78', '+2.10%', true),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildMarketIndexItem(AppStrings.star50Index, '1,123.45', '+0.78%', true),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMarketIndexItem(String name, String value, String change, bool isPositive) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          name,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.grey,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          change,
          style: TextStyle(
            fontSize: 12,
            color: isPositive ? Colors.red : Colors.green,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _buildStockList(BuildContext context) {
    final stocks = [
      {'symbol': 'AAPL', 'name': AppStrings.appleInc, 'price': '\$175.43', 'change': '+2.34%', 'isPositive': true},
      {'symbol': 'TSLA', 'name': AppStrings.tesla, 'price': '\$248.50', 'change': '-1.23%', 'isPositive': false},
      {'symbol': 'MSFT', 'name': AppStrings.microsoft, 'price': '\$378.85', 'change': '+0.87%', 'isPositive': true},
      {'symbol': 'GOOGL', 'name': AppStrings.google, 'price': '\$142.56', 'change': '+1.45%', 'isPositive': true},
    ];

    return Column(
      children: stocks.map((stock) => _buildStockItem(context, stock)).toList(),
    );
  }

  Widget _buildGainersLosersList(BuildContext context) {
    final gainersLosers = [
      {'symbol': 'NVDA', 'name': AppStrings.nvidia, 'price': '\$875.28', 'change': '+5.67%', 'isPositive': true},
      {'symbol': 'AMD', 'name': AppStrings.amd, 'price': '\$152.34', 'change': '+4.23%', 'isPositive': true},
      {'symbol': 'INTC', 'name': AppStrings.intel, 'price': '\$43.21', 'change': '-3.45%', 'isPositive': false},
      {'symbol': 'META', 'name': AppStrings.meta, 'price': '\$485.75', 'change': '-2.18%', 'isPositive': false},
    ];

    return Column(
      children: gainersLosers.map((stock) => _buildStockItem(context, stock)).toList(),
    );
  }

  Widget _buildStockItem(BuildContext context, Map<String, dynamic> stock) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Colors.blue.shade100,
          child: Text(
            stock['symbol'].substring(0, 2),
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
        title: Text(
          stock['name'],
          style: const TextStyle(
            fontWeight: FontWeight.w500,
          ),
        ),
        subtitle: Text(
          stock['symbol'],
          style: const TextStyle(
            color: Colors.grey,
            fontSize: 12,
          ),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              stock['price'],
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            Text(
              stock['change'],
              style: TextStyle(
                color: stock['isPositive'] ? Colors.red : Colors.green,
                fontWeight: FontWeight.w500,
                fontSize: 12,
              ),
            ),
          ],
        ),
        onTap: () {
          // 跳转到个股详情页
          context.push('/stock/${stock['symbol']}');
        },
      ),
    );
  }
}