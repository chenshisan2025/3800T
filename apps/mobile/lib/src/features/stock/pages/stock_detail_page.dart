import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/widgets/widgets.dart';
import '../widgets/stock_chart.dart';
import '../../../core/constants/app_strings.dart';

class StockDetailPage extends StatefulWidget {
  final String symbol;

  const StockDetailPage({super.key, required this.symbol});

  @override
  State<StockDetailPage> createState() => _StockDetailPageState();
}

class _StockDetailPageState extends State<StockDetailPage> {
  String selectedPeriod = AppStrings.dailyK;
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
                    text: AppStrings.timeSharing,
                    type: selectedPeriod == AppStrings.timeSharing ? ButtonType.primary :
                    ButtonType.ghost,
                    size: ButtonSize.small,
                    onPressed: () => setState(() => selectedPeriod = AppStrings.timeSharing),
                  ),
                const SizedBox(width: 8),
                CustomButton(
                  text: AppStrings.dailyK,
                  type: selectedPeriod == AppStrings.dailyK ? ButtonType.primary :
                  ButtonType.ghost,
                  size: ButtonSize.small,
                  onPressed: () => setState(() => selectedPeriod = AppStrings.dailyK),
                ),
                const SizedBox(width: 8),
                CustomButton(
                  text: AppStrings.weeklyK,
                  type: selectedPeriod == AppStrings.weeklyK ? ButtonType.primary :
                  ButtonType.ghost,
                  size: ButtonSize.small,
                  onPressed: () => setState(() => selectedPeriod = AppStrings.weeklyK),
                ),
                const Spacer(),
                CustomButton(
                  text: 'MA',
                  type: selectedIndicator == 'MA' ? ButtonType.secondary : ButtonType.ghost,
                  size: ButtonSize.small,
                  onPressed: () => setState(() => selectedIndicator = 'MA'),
                ),
                const SizedBox(width: 4),
                CustomButton(
                  text: 'MACD',
                  type: selectedIndicator == 'MACD' ? ButtonType.secondary : ButtonType.ghost,
                  size: ButtonSize.small,
                  onPressed: () => setState(() => selectedIndicator = 'MACD'),
                ),
                const SizedBox(width: 4),
                CustomButton(
                  text: 'RSI',
                  type: selectedIndicator == 'RSI' ? ButtonType.secondary : ButtonType.ghost,
                  size: ButtonSize.small,
                  onPressed: () => setState(() => selectedIndicator = 'RSI'),
                ),
              ],
            ),
          ),
          // K线图表
          Expanded(
            flex: 2,
            child: Container(
              margin: const EdgeInsets.all(16),
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
              child: StockChart(
                symbol: widget.symbol,
                period: selectedPeriod,
                indicator: selectedIndicator,
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
                  title: AppStrings.fundamentals,
                  value: AppStrings.good,
                  subtitle: 'PE: 12.5 | PB: 1.8',
                  icon: const Icon(Icons.assessment, size: 20),
                  onTap: () => _showInfoDetail(AppStrings.fundamentals),
                ),
                StockInfoCard(
                  title: AppStrings.news,
                  value: AppStrings.newsCount(5),
                  subtitle: AppStrings.todayUpdateImportantAnnouncement,
                  icon: const Icon(Icons.article, size: 20),
                  onTap: () => _showInfoDetail(AppStrings.news),
                ),
                StockInfoCard(
                  title: AppStrings.financialData,
                  value: AppStrings.stable,
                  subtitle: AppStrings.roeRevenueGrowth,
                  icon: const Icon(Icons.account_balance, size: 20),
                  onTap: () => _showInfoDetail(AppStrings.financialData),
                ),
                StockInfoCard(
                  title: AppStrings.technicalAnalysis,
                  value: AppStrings.strong,
                  subtitle: AppStrings.rsiBreakResistance,
                  icon: const Icon(Icons.analytics, size: 20),
                  isRise: true,
                  onTap: () => _showInfoDetail(AppStrings.technicalAnalysis),
                ),
              ],
            ),
          ),
          // 合规组件
          const Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              children: [
                InvestmentDisclaimer(
                  position: ComponentPosition.bottom,
                  theme: ComponentTheme.light,
                  showIcon: true,
                  closable: true,
                ),
                SizedBox(height: 8),
                RealtimeDataSourceHint(
                  position: ComponentPosition.bottom,
                  theme: ComponentTheme.light,
                  showIcon: true,
                  closable: false,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // 旧的按钮构建方法已移除，使用CustomButton组件替代

  void _showInfoDetail(String title) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.9,
        builder: (context, scrollController) => Container(
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // 拖拽指示器
              Container(
                margin: const EdgeInsets.symmetric(vertical: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // 标题
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
              ),
              const Divider(),
              // 内容
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(20),
                  child: _buildDetailContent(title),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailContent(String title) {
    switch (title) {
      case AppStrings.fundamentals:
        return _buildFundamentalContent();
      case AppStrings.news:
        return _buildNewsContent();
      case AppStrings.financialData:
        return _buildFinancialContent();
      case AppStrings.technicalAnalysis:
        return _buildTechnicalContent();
      default:
        return Text('${AppStrings.noDataAvailable}$title${AppStrings.relatedInfo}');
    }
  }

  Widget _buildFundamentalContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildInfoRow(AppStrings.peRatio, '12.5', '${AppStrings.industryAverage}: 15.2'),
        _buildInfoRow(AppStrings.pbRatio, '1.8', '${AppStrings.industryAverage}: 2.1'),
        _buildInfoRow(AppStrings.marketCap, AppStrings.marketCapValue, '${AppStrings.floatMarketCap}: ${AppStrings.floatMarketCapValue}'),
        _buildInfoRow(AppStrings.totalShares, AppStrings.totalSharesValue, '${AppStrings.floatShares}: ${AppStrings.floatSharesValue}'),
        const SizedBox(height: 16),
        Text(
          AppStrings.fundamentalAnalysis,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          AppStrings.fundamentalAnalysisDesc,
        ),
      ],
    );
  }

  Widget _buildNewsContent() {
    return Column(
      children: [
        _buildNewsItem(
          AppStrings.q3FinancialReport,
          AppStrings.revenueNetProfitGrowth,
          AppStrings.hoursAgo(2),
        ),
        _buildNewsItem(
          AppStrings.strategicInvestment,
          AppStrings.newEnergyCooperation,
          AppStrings.daysAgo(1),
        ),
        _buildNewsItem(
          AppStrings.dividendProposal,
          AppStrings.dividendDetails,
          AppStrings.daysAgo(3),
        ),
        _buildNewsItem(
          AppStrings.productCertification,
          AppStrings.technicalInnovation,
          AppStrings.weeksAgo(1),
        ),
      ],
    );
  }

  Widget _buildFinancialContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          AppStrings.profitability,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        _buildInfoRow(AppStrings.roe, '15.2%', '同比+2.1%'),
        _buildInfoRow(AppStrings.roa, '8.7%', '同比+1.3%'),
        _buildInfoRow(AppStrings.grossMargin, '35.6%', '同比+0.8%'),
        const SizedBox(height: 16),
        Text(
          AppStrings.growthAbility,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        _buildInfoRow(AppStrings.revenueGrowth, '15.2%', '近三年平均: 12.8%'),
        _buildInfoRow(AppStrings.netProfitGrowth, '18.5%', '近三年平均: 15.3%'),
        const SizedBox(height: 16),
        Text(
          AppStrings.solvency,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        _buildInfoRow(AppStrings.debtRatio, '45.2%', '行业平均: 52.1%'),
        _buildInfoRow(AppStrings.currentRatio, '2.1', '行业平均: 1.8'),
      ],
    );
  }

  Widget _buildTechnicalContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          AppStrings.technicalIndicators,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        _buildInfoRow(AppStrings.rsi, '68.5', AppStrings.overboughtZone),
        _buildInfoRow(AppStrings.macd, '0.15', 'DEA: 0.12'),
        _buildInfoRow(AppStrings.kdj, 'K:75 D:68 J:82', AppStrings.goldenCross),
        const SizedBox(height: 16),
        Text(
          AppStrings.supportResistance,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        _buildInfoRow(AppStrings.resistance1, '¥13.50', '前期高点'),
        _buildInfoRow(AppStrings.resistance2, '¥14.20', '重要整数关口'),
        _buildInfoRow(AppStrings.support1, '¥11.80', '20日均线'),
        _buildInfoRow(AppStrings.support2, '¥11.20', '前期低点'),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.blue.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '技术面总结',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.blue[700],
                ),
              ),
              const SizedBox(height: 4),
              Text(
                AppStrings.technicalAnalysisDesc,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value, String? subtitle) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
          Expanded(
            flex: 3,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  value,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (subtitle != null)
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNewsItem(String title, String subtitle, String time) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.withOpacity(0.2)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              Text(
                time,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.grey[700],
            ),
          ),
        ],
      ),
    );
  }
}