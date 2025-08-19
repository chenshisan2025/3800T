import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/widgets/widgets.dart';

class StockDetailPage extends StatefulWidget {
  final String symbol;

  const StockDetailPage({super.key, required this.symbol});

  @override
  State<StockDetailPage> createState() => _StockDetailPageState();
}

class _StockDetailPageState extends State<StockDetailPage> {
  String selectedPeriod = '日K';
  String selectedIndicator = 'MA';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.symbol),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: Column(
        children: [
          // 股票基本信息卡片
          CustomCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      widget.symbol,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    CustomTag(
                      text: widget.symbol,
                      type: TagType.default_,
                      size: TagSize.small,
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text(
                      '¥12.34',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).extension<StockColors>()?.riseColor ?? Colors.red,
                      ),
                    ),
                    const SizedBox(width: 12),
                    StockTag(
                      text: '+0.56 (+4.76%)',
                      isRise: true,
                      size: TagSize.small,
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Divider(),
          // 图表切换按钮
          Container(
            margin: const EdgeInsets.symmetric(vertical: 8),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                CustomButton(
                  text: '分时',
                  type: selectedPeriod == '分时' ? ButtonType.primary : ButtonType.ghost,
                  size: ButtonSize.small,
                  onPressed: () => setState(() => selectedPeriod = '分时'),
                ),
                const SizedBox(width: 8),
                CustomButton(
                  text: '日K',
                  type: selectedPeriod == '日K' ? ButtonType.primary : ButtonType.ghost,
                  size: ButtonSize.small,
                  onPressed: () => setState(() => selectedPeriod = '日K'),
                ),
                const SizedBox(width: 8),
                CustomButton(
                  text: '周K',
                  type: selectedPeriod == '周K' ? ButtonType.primary : ButtonType.ghost,
                  size: ButtonSize.small,
                  onPressed: () => setState(() => selectedPeriod = '周K'),
                ),
                const Spacer(),
                CustomButton(
                  text: 'MA',
                  type: selectedIndicator == 'MA' ? ButtonType.secondary : ButtonType.ghost,
                  size: ButtonSize.small,
                  onPressed: () => setState(() => selectedIndicator = 'MA'),
                ),
                const SizedBox(width: 8),
                CustomButton(
                  text: 'MACD',
                  type: selectedIndicator == 'MACD' ? ButtonType.secondary : ButtonType.ghost,
                  size: ButtonSize.small,
                  onPressed: () => setState(() => selectedIndicator = 'MACD'),
                ),
              ],
            ),
          ),
          // K线图占位
          Expanded(
            flex: 2,
            child: Container(
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.show_chart,
                      size: 64,
                      color: Colors.grey,
                    ),
                    SizedBox(height: 16),
                    Text(
                      'K线图表',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          // 信息卡片
          Expanded(
            flex: 1,
            child: GridView.count(
              crossAxisCount: 2,
              padding: const EdgeInsets.all(16),
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
              childAspectRatio: 2,
              children: [
                StockInfoCard(
                  title: '基本面',
                  value: '良好',
                  subtitle: 'PE: 12.5',
                  icon: Icons.assessment,
                  onTap: () => _showInfoDetail('基本面'),
                ),
                StockInfoCard(
                  title: '新闻',
                  value: '5条',
                  subtitle: '今日更新',
                  icon: Icons.article,
                  onTap: () => _showInfoDetail('新闻'),
                ),
                StockInfoCard(
                  title: '财务',
                  value: '稳健',
                  subtitle: 'ROE: 15.2%',
                  icon: Icons.account_balance,
                  onTap: () => _showInfoDetail('财务'),
                ),
                StockInfoCard(
                  title: '技术分析',
                  value: '强势',
                  subtitle: 'RSI: 68',
                  icon: Icons.analytics,
                  isRise: true,
                  onTap: () => _showInfoDetail('技术分析'),
                ),
              ],
            ),
          ),
          // 免责声明
          Container(
            padding: const EdgeInsets.all(16),
            child: const Text(
              '以上信息仅供参考，不构成投资建议',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }

  // 旧的按钮构建方法已移除，使用CustomButton组件替代

  void _showInfoDetail(String title) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text('这里显示$title的详细信息'),
        actions: [
          CustomButton(
            text: '关闭',
            type: ButtonType.ghost,
            size: ButtonSize.small,
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
    );
  }
}