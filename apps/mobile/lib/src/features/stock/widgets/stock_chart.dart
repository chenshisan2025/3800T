import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../shared/widgets/custom_card.dart';

class StockChart extends StatefulWidget {
  final String symbol;
  final String period;
  final String indicator;

  const StockChart({
    super.key,
    required this.symbol,
    required this.period,
    required this.indicator,
  });

  @override
  State<StockChart> createState() => _StockChartState();
}

class _StockChartState extends State<StockChart> {
  List<FlSpot> _generateMockData() {
    // 生成模拟K线数据
    final List<FlSpot> spots = [];
    double basePrice = 12.34;
    
    for (int i = 0; i < 30; i++) {
      // 模拟价格波动
      basePrice += (i % 3 == 0 ? 0.1 : -0.05) * (i % 2 == 0 ? 1 : -1);
      spots.add(FlSpot(i.toDouble(), basePrice));
    }
    
    return spots;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final spots = _generateMockData();
    
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 图表标题
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${widget.symbol} - ${widget.period}',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                widget.indicator,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // 价格信息
          Row(
            children: [
              Text(
                '¥${spots.last.y.toStringAsFixed(2)}',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: spots.last.y > spots.first.y 
                      ? theme.extension<StockColors>()?.riseColor ?? Colors.red
                      : theme.extension<StockColors>()?.fallColor ?? Colors.green,
                ),
              ),
              const SizedBox(width: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: (spots.last.y > spots.first.y 
                      ? theme.extension<StockColors>()?.riseColor ?? Colors.red
                      : theme.extension<StockColors>()?.fallColor ?? Colors.green)
                      .withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  '${spots.last.y > spots.first.y ? '+' : ''}${((spots.last.y - spots.first.y) / spots.first.y * 100).toStringAsFixed(2)}%',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: spots.last.y > spots.first.y 
                        ? theme.extension<StockColors>()?.riseColor ?? Colors.red
                        : theme.extension<StockColors>()?.fallColor ?? Colors.green,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          // 图表
          Expanded(
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: true,
                  horizontalInterval: 0.2,
                  verticalInterval: 5,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(
                      color: Colors.grey.withOpacity(0.2),
                      strokeWidth: 1,
                    );
                  },
                  getDrawingVerticalLine: (value) {
                    return FlLine(
                      color: Colors.grey.withOpacity(0.2),
                      strokeWidth: 1,
                    );
                  },
                ),
                titlesData: FlTitlesData(
                  show: true,
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 30,
                      interval: 5,
                      getTitlesWidget: (double value, TitleMeta meta) {
                        if (value % 5 != 0) return Container();
                        return SideTitleWidget(
                          axisSide: meta.axisSide,
                          child: Text(
                            '${value.toInt()}',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: Colors.grey[600],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      interval: 0.2,
                      reservedSize: 50,
                      getTitlesWidget: (double value, TitleMeta meta) {
                        return SideTitleWidget(
                          axisSide: meta.axisSide,
                          child: Text(
                            value.toStringAsFixed(1),
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: Colors.grey[600],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(
                  show: true,
                  border: Border.all(
                    color: Colors.grey.withOpacity(0.3),
                    width: 1,
                  ),
                ),
                minX: 0,
                maxX: spots.length.toDouble() - 1,
                minY: spots.map((e) => e.y).reduce((a, b) => a < b ? a : b) - 0.5,
                maxY: spots.map((e) => e.y).reduce((a, b) => a > b ? a : b) + 0.5,
                lineBarsData: [
                  LineChartBarData(
                    spots: spots,
                    isCurved: false,
                    gradient: LinearGradient(
                      colors: [
                        theme.primaryColor,
                        theme.primaryColor.withOpacity(0.3),
                      ],
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                    ),
                    barWidth: 2,
                    isStrokeCapRound: true,
                    dotData: const FlDotData(
                      show: false,
                    ),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        colors: [
                          theme.primaryColor.withOpacity(0.1),
                          theme.primaryColor.withOpacity(0.05),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ],
                lineTouchData: LineTouchData(
                  enabled: true,
                  touchTooltipData: LineTouchTooltipData(
                    getTooltipItems: (List<LineBarSpot> touchedBarSpots) {
                      return touchedBarSpots.map((barSpot) {
                        return LineTooltipItem(
                          '¥${barSpot.y.toStringAsFixed(2)}',
                          TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        );
                      }).toList();
                    },
                  ),
                ),
              ),
            ),
          ),
          // 技术指标说明
          if (widget.indicator != 'MA') ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.info_outline,
                    size: 16,
                    color: Colors.grey[600],
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _getIndicatorDescription(widget.indicator),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.grey[600],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _getIndicatorDescription(String indicator) {
    switch (indicator) {
      case 'MACD':
        return 'MACD指标用于判断股价趋势变化，当MACD线上穿信号线时为买入信号';
      case 'RSI':
        return 'RSI指标用于判断股票超买超卖状态，数值在30-70之间为正常区间';
      case 'KDJ':
        return 'KDJ指标结合动量观念、强弱指标及移动平均线的优点';
      default:
        return 'MA移动平均线反映股价趋势方向，常用于判断支撑和阻力位';
    }
  }
}