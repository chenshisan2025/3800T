import 'package:flutter/material.dart';
import '../../shared/widgets/custom_card.dart';
import '../../shared/widgets/custom_button.dart';
import '../../../core/constants/app_strings.dart';

class AiPage extends StatefulWidget {
  const AiPage({super.key});

  @override
  State<AiPage> createState() => _AiPageState();
}

class _AiPageState extends State<AiPage> {
  String _selectedStock = 'AAPL';
  bool _isAnalyzing = false;
  final List<AgentAnalysis> _analyses = [];
  
  final List<String> _stockOptions = [
    'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'META'
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(AppStrings.aiAnalysis),
        elevation: 0,
      ),
      body: Column(
        children: [
          // 股票选择区域
          _buildStockSelector(),
          // 分析按钮
          _buildAnalyzeButton(),
          // 分析结果
          Expanded(
            child: _isAnalyzing
                ? _buildAnalyzingView()
                : _analyses.isEmpty
                    ? _buildEmptyView()
                    : _buildAnalysisResults(),
          ),
        ],
      ),
    );
  }

  Widget _buildStockSelector() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            AppStrings.selectStock,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _stockOptions.map((stock) {
              final isSelected = stock == _selectedStock;
              return GestureDetector(
                onTap: () => setState(() => _selectedStock = stock),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? Theme.of(context).primaryColor
                        : Colors.grey.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isSelected
                          ? Theme.of(context).primaryColor
                          : Colors.grey.withOpacity(0.3),
                    ),
                  ),
                  child: Text(
                    stock,
                    style: TextStyle(
                      color: isSelected
                          ? Colors.white
                          : Theme.of(context).textTheme.bodyMedium?.color,
                      fontWeight: isSelected
                          ? FontWeight.bold
                          : FontWeight.normal,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildAnalyzeButton() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: SizedBox(
        width: double.infinity,
        child: CustomButton(
          text: _isAnalyzing ? AppStrings.analyzing : AppStrings.startAiAnalysis,
          onPressed: _isAnalyzing ? null : _startAnalysis,
          type: CustomButtonType.primary,
          size: CustomButtonSize.large,
        ),
      ),
    );
  }

  Widget _buildEmptyView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.psychology_outlined,
            size: 80,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            AppStrings.selectStockToStartAnalysis,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            AppStrings.aiAnalysisDescription,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnalyzingView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 24),
          Text(
            '${AppStrings.analyzing} $_selectedStock',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            AppStrings.aiAnalyzingFromMultipleDimensions,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnalysisResults() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 汇总卡片
          _buildSummaryCard(),
          const SizedBox(height: 16),
          // Agent分析卡片
          ..._analyses.map((analysis) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _buildAgentCard(analysis),
              )),
        ],
      ),
    );
  }

  Widget _buildSummaryCard() {
    final overallScore = _calculateOverallScore();
    final recommendation = _getRecommendation(overallScore);
    
    return CustomCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.summarize,
                color: Theme.of(context).primaryColor,
              ),
              const SizedBox(width: 8),
              Text(
                AppStrings.aiComprehensiveAnalysis,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      AppStrings.overallScore,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${overallScore.toStringAsFixed(1)}/10',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: _getScoreColor(overallScore),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      AppStrings.investmentRecommendation,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: _getRecommendationColor(recommendation).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        recommendation,
                        style: TextStyle(
                          color: _getRecommendationColor(recommendation),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAgentCard(AgentAnalysis analysis) {
    return CustomCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: analysis.color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  analysis.icon,
                  color: analysis.color,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      analysis.agentName,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      analysis.category,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: _getScoreColor(analysis.score).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${analysis.score.toStringAsFixed(1)}${AppStrings.score}',
                  style: TextStyle(
                    color: _getScoreColor(analysis.score),
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            analysis.summary,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 8),
          ...analysis.keyPoints.map((point) => Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      margin: const EdgeInsets.only(top: 6),
                      width: 4,
                      height: 4,
                      decoration: BoxDecoration(
                        color: analysis.color,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        point,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  void _startAnalysis() async {
    setState(() {
      _isAnalyzing = true;
      _analyses.clear();
    });

    // 模拟AI分析过程
    await Future.delayed(const Duration(seconds: 3));

    setState(() {
      _analyses.addAll(_generateMockAnalyses());
      _isAnalyzing = false;
    });
  }

  List<AgentAnalysis> _generateMockAnalyses() {
    return [
      AgentAnalysis(
        agentName: AppStrings.technicalAnalyst,
        category: AppStrings.technicalAnalysisCategory,
        icon: Icons.trending_up,
        color: Colors.blue,
        score: 7.5,
        summary: AppStrings.technicalAnalysisSummary.replaceAll('{stock}', _selectedStock),
        keyPoints: [
          AppStrings.technicalPoint1,
          AppStrings.technicalPoint2,
          AppStrings.technicalPoint3,
          AppStrings.technicalPoint4,
        ],
      ),
      AgentAnalysis(
        agentName: AppStrings.fundamentalAnalyst,
        category: AppStrings.fundamentalAnalysisCategory,
        icon: Icons.analytics,
        color: Colors.green,
        score: 8.2,
        summary: AppStrings.fundamentalAnalysisSummary.replaceAll('{stock}', _selectedStock),
        keyPoints: [
          AppStrings.fundamentalPoint1,
          AppStrings.fundamentalPoint2,
          AppStrings.fundamentalPoint3,
          AppStrings.fundamentalPoint4,
        ],
      ),
      AgentAnalysis(
        agentName: AppStrings.sentimentAnalyst,
        category: AppStrings.sentimentAnalysisCategory,
        icon: Icons.psychology,
        color: Colors.orange,
        score: 6.8,
        summary: AppStrings.sentimentAnalysisSummary.replaceAll('{stock}', _selectedStock),
        keyPoints: [
          AppStrings.sentimentPoint1,
          AppStrings.sentimentPoint2,
          AppStrings.sentimentPoint3,
          AppStrings.sentimentPoint4,
        ],
      ),
      AgentAnalysis(
        agentName: AppStrings.macroAnalyst,
        category: AppStrings.macroAnalysisCategory,
        icon: Icons.public,
        color: Colors.purple,
        score: 7.1,
        summary: AppStrings.macroAnalysisSummary.replaceAll('{stock}', _selectedStock),
        keyPoints: [
          AppStrings.macroPoint1,
          AppStrings.macroPoint2,
          AppStrings.macroPoint3,
          AppStrings.macroPoint4,
        ],
      ),
    ];
  }

  double _calculateOverallScore() {
    if (_analyses.isEmpty) return 0;
    return _analyses.map((a) => a.score).reduce((a, b) => a + b) / _analyses.length;
  }

  String _getRecommendation(double score) {
    if (score >= 8) return AppStrings.strongBuy;
    if (score >= 7) return AppStrings.buy;
    if (score >= 6) return AppStrings.hold;
    if (score >= 5) return AppStrings.watch;
    return AppStrings.sell;
  }

  Color _getScoreColor(double score) {
    if (score >= 8) return Colors.green;
    if (score >= 7) return Colors.lightGreen;
    if (score >= 6) return Colors.orange;
    if (score >= 5) return Colors.deepOrange;
    return Colors.red;
  }

  Color _getRecommendationColor(String recommendation) {
    if (recommendation == AppStrings.strongBuy || recommendation == AppStrings.buy) {
      return Colors.green;
    } else if (recommendation == AppStrings.hold) {
      return Colors.blue;
    } else if (recommendation == AppStrings.watch) {
      return Colors.orange;
    } else if (recommendation == AppStrings.sell) {
      return Colors.red;
    } else {
      return Colors.grey;
    }
  }
}

class AgentAnalysis {
  final String agentName;
  final String category;
  final IconData icon;
  final Color color;
  final double score;
  final String summary;
  final List<String> keyPoints;

  AgentAnalysis({
    required this.agentName,
    required this.category,
    required this.icon,
    required this.color,
    required this.score,
    required this.summary,
    required this.keyPoints,
  });
}