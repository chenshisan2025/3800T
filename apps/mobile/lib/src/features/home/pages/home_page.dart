import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/widgets/widgets.dart';
import '../../../core/constants/app_strings.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(AppStrings.appName),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              // TODO: 实现搜索功能
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // 市场概览卡片
          CustomCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  AppStrings.marketOverview,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildMarketItem(context, AppStrings.shanghaiIndex, '3245.67', '+1.23%', true),
                    _buildMarketItem(context, AppStrings.shenzhenIndex, '12456.78', '-0.45%', false),
                    _buildMarketItem(context, AppStrings.chinextIndex, '2567.89', '+2.10%', true),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          
          // 热门股票
          CustomCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      AppStrings.hotStocks,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    CustomTag(
                      text: AppStrings.realTime,
                      type: TagType.info,
                      size: TagSize.small,
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _buildStockItem(context, '000001', AppStrings.pinganBank, '12.34', '+0.56', '+4.76%'),
                _buildStockItem(context, '000002', AppStrings.vankeA, '23.45', '-0.23', '-0.97%'),
                _buildStockItem(context, '600036', AppStrings.cmb, '45.67', '+1.23', '+2.77%'),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildMarketItem(BuildContext context, String name, String value, String change, bool isRise) {
    return Column(
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
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          change,
          style: TextStyle(
            fontSize: 12,
            color: isRise 
                ? Theme.of(context).extension<StockColors>()?.riseColor ?? Colors.red
                : Theme.of(context).extension<StockColors>()?.fallColor ?? Colors.green,
          ),
        ),
      ],
    );
  }
  
  Widget _buildStockItem(BuildContext context, String code, String name, String price, String change, String changePercent) {
    final isRise = !change.startsWith('-');
    
    return InkWell(
      onTap: () {
        context.go('/stock/$code');
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Expanded(
              flex: 2,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    code,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: Text(
                price,
                textAlign: TextAlign.right,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    change,
                    style: TextStyle(
                      fontSize: 12,
                      color: isRise 
                          ? Theme.of(context).extension<StockColors>()?.riseColor ?? Colors.red
                          : Theme.of(context).extension<StockColors>()?.fallColor ?? Colors.green,
                    ),
                  ),
                  Text(
                    changePercent,
                    style: TextStyle(
                      fontSize: 12,
                      color: isRise 
                          ? Theme.of(context).extension<StockColors>()?.riseColor ?? Colors.red
                          : Theme.of(context).extension<StockColors>()?.fallColor ?? Colors.green,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}