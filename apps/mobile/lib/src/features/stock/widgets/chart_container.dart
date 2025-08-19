import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';

import '../models/stock_model.dart';
import '../providers/stock_provider.dart';
import 'indicator_selector.dart';

class ChartContainer extends ConsumerStatefulWidget {
  const ChartContainer({
    super.key,
    required this.symbol,
    required this.period,
  });
  
  final String symbol;
  final ChartPeriod period;

  @override
  ConsumerState<ChartContainer> createState() => _ChartContainerState();
}

class _ChartContainerState extends ConsumerState<ChartContainer> {
  late ChartApi _chartApi;
  late CandlestickSeries _candlestickSeries;
  List<IndicatorType> _selectedIndicators = [IndicatorType.ma5, IndicatorType.ma20];
  final Map<IndicatorType, LineSeries> _indicatorSeries = {};
  
  @override
  void initState() {
    super.initState();
    _initChart();
  }
  
  void _initChart() {
    _chartApi = ChartApi();
    _candlestickSeries = _chartApi.addCandlestickSeries(
      options: CandlestickSeriesOptions(
        upColor: Colors.red, // 红涨
        downColor: Colors.green, // 绿跌
        borderUpColor: Colors.red,
        borderDownColor: Colors.green,
        wickUpColor: Colors.red,
        wickDownColor: Colors.green,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final klineAsync = ref.watch(klineDataProvider(KlineParams(
      symbol: widget.symbol,
      period: widget.period,
    )));
    
    final indicatorAsync = ref.watch(technicalIndicatorProvider(IndicatorParams(
      symbol: widget.symbol,
      period: widget.period,
      indicators: _selectedIndicators,
    )));
    
    return Container(
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
      child: Column(
        children: [
          // 指标选择器
          IndicatorSelector(
            selectedIndicators: _selectedIndicators,
            onIndicatorsChanged: (indicators) {
              setState(() {
                _selectedIndicators = indicators;
              });
              _updateIndicators();
            },
          ),
          
          // 图表区域
          Expanded(
            child: klineAsync.when(
              data: (klineData) => _buildChart(klineData, indicatorAsync),
              loading: () => const Center(
                child: CircularProgressIndicator(),
              ),
              error: (error, stack) => Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 48, color: Colors.grey),
                    const SizedBox(height: 8),
                    Text('图表加载失败'),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () {
                        ref.refresh(klineDataProvider(KlineParams(
                          symbol: widget.symbol,
                          period: widget.period,
                        )));
                      },
                      child: const Text('重试'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildChart(List<KLineData> klineData, AsyncValue<List<TechnicalIndicator>> indicatorAsync) {
    // 更新K线数据
    _updateKlineData(klineData);
    
    // 更新技术指标数据
    indicatorAsync.whenData((indicators) {
      _updateIndicatorData(indicators);
    });
    
    return Container(
      height: 300,
      padding: const EdgeInsets.all(8),
      child: widget.period == ChartPeriod.minute
          ? _buildTimeChart(klineData) // 分时图
          : LightweightCharts(
              options: ChartOptions(
                layout: LayoutOptions(
                  backgroundColor: Theme.of(context).cardColor,
                  textColor: Theme.of(context).textTheme.bodyMedium?.color,
                ),
                grid: GridOptions(
                  vertLines: GridLineOptions(
                    color: Colors.grey.withOpacity(0.2),
                  ),
                  horzLines: GridLineOptions(
                    color: Colors.grey.withOpacity(0.2),
                  ),
                ),
                timeScale: TimeScaleOptions(
                  timeVisible: true,
                  secondsVisible: false,
                ),
              ),
              onChartCreated: (ChartApi chartApi) {
                _chartApi = chartApi;
                _initChart();
                _updateKlineData(klineData);
              },
            ),
    );
  }
  
  Widget _buildTimeChart(List<KLineData> klineData) {
    // 分时图实现（简化版本）
    return Container(
      padding: const EdgeInsets.all(16),
      child: CustomPaint(
        painter: TimeChartPainter(klineData),
        size: Size.infinite,
      ),
    );
  }
  
  void _updateKlineData(List<KLineData> klineData) {
    final candlestickData = klineData.map((data) => CandlestickData(
      time: data.time.millisecondsSinceEpoch ~/ 1000,
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
    )).toList();
    
    _candlestickSeries.setData(candlestickData);
  }
  
  void _updateIndicatorData(List<TechnicalIndicator> indicators) {
    for (final indicator in indicators) {
      final indicatorType = _getIndicatorType(indicator.name);
      if (indicatorType != null) {
        LineSeries? series = _indicatorSeries[indicatorType];
        
        if (series == null) {
          series = _chartApi.addLineSeries(
            options: LineSeriesOptions(
              color: indicator.color,
              lineWidth: 1,
            ),
          );
          _indicatorSeries[indicatorType] = series;
        }
        
        final lineData = indicator.values.asMap().entries.map((entry) {
          return LineData(
            time: DateTime.now().subtract(Duration(days: indicator.values.length - entry.key - 1)).millisecondsSinceEpoch ~/ 1000,
            value: entry.value,
          );
        }).toList();
        
        series.setData(lineData);
      }
    }
  }
  
  void _updateIndicators() {
    // 清除旧的指标线
    for (final series in _indicatorSeries.values) {
      _chartApi.removeSeries(series);
    }
    _indicatorSeries.clear();
    
    // 刷新指标数据
    ref.refresh(technicalIndicatorProvider(IndicatorParams(
      symbol: widget.symbol,
      period: widget.period,
      indicators: _selectedIndicators,
    )));
  }
  
  IndicatorType? _getIndicatorType(String name) {
    switch (name) {
      case 'MA5':
        return IndicatorType.ma5;
      case 'MA10':
        return IndicatorType.ma10;
      case 'MA20':
        return IndicatorType.ma20;
      case 'MA60':
        return IndicatorType.ma60;
      case 'MACD':
        return IndicatorType.macd;
      case 'KDJ':
        return IndicatorType.kdj;
      case 'RSI':
        return IndicatorType.rsi;
      default:
        return null;
    }
  }
}

// 分时图绘制器
class TimeChartPainter extends CustomPainter {
  final List<KLineData> data;
  
  TimeChartPainter(this.data);
  
  @override
  void paint(Canvas canvas, Size size) {
    if (data.isEmpty) return;
    
    final paint = Paint()
      ..color = Colors.blue
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;
    
    final path = Path();
    final maxPrice = data.map((d) => d.close).reduce((a, b) => a > b ? a : b);
    final minPrice = data.map((d) => d.close).reduce((a, b) => a < b ? a : b);
    final priceRange = maxPrice - minPrice;
    
    for (int i = 0; i < data.length; i++) {
      final x = (i / (data.length - 1)) * size.width;
      final y = size.height - ((data[i].close - minPrice) / priceRange) * size.height;
      
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    
    canvas.drawPath(path, paint);
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}