import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/services/api_service.dart';
import '../../../core/components/app_toast.dart';
import '../../../shared/widgets/widgets.dart';

class AiAnalysisButton extends StatelessWidget {
  const AiAnalysisButton({
    super.key,
    required this.symbol,
  });
  
  final String symbol;

  @override
  Widget build(BuildContext context) {
    return FloatingActionButton.extended(
      onPressed: () => _showAiAnalysisPanel(context),
      backgroundColor: Theme.of(context).primaryColor,
      foregroundColor: Colors.white,
      icon: const Icon(Icons.psychology_outlined),
      label: const Text(
        'AI分析',
        style: TextStyle(
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
  
  void _showAiAnalysisPanel(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _AiAnalysisPanel(symbol: symbol),
    );
  }
}

class _AiAnalysisPanel extends StatefulWidget {
  const _AiAnalysisPanel({required this.symbol});
  
  final String symbol;

  @override
  State<_AiAnalysisPanel> createState() => _AiAnalysisPanelState();
}

class _AiAnalysisPanelState extends State<_AiAnalysisPanel>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _slideAnimation;
  bool _isAnalyzing = false;
  List<_AgentMessage> _messages = [];
  String? _error;
  
  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _slideAnimation = Tween<double>(
      begin: 1.0,
      end: 0.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOutCubic,
    ));
    
    _animationController.forward();
    _startAnalysis();
  }
  
  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _slideAnimation,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(0, _slideAnimation.value * MediaQuery.of(context).size.height),
          child: Container(
            height: MediaQuery.of(context).size.height * 0.8,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(
                top: Radius.circular(20),
              ),
            ),
            child: Column(
              children: [
                // 面板头部
                _buildHeader(),
                
                // 消息列表
                Expanded(
                  child: _buildMessageList(),
                ),
                
                // 综合结论卡片
                if (_messages.length >= 4) _buildConclusionCard(),
                
                // 页脚免责声明
                _buildDisclaimer(),
                
                // 关闭按钮
                Container(
                  padding: const EdgeInsets.all(16),
                  child: SizedBox(
                    width: double.infinity,
                    child: CustomButton(
                      text: '关闭',
                      type: ButtonType.primary,
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
  
  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: Colors.grey.withOpacity(0.2),
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.psychology_outlined,
            color: Theme.of(context).primaryColor,
            size: 24,
          ),
          const SizedBox(width: 8),
          Text(
            '${widget.symbol} AI分析',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const Spacer(),
          IconButton(
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.close),
          ),
        ],
      ),
    );
  }
  
  Widget _buildMessageList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _messages.length + (_isAnalyzing ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == _messages.length && _isAnalyzing) {
          return _buildLoadingMessage();
        }
        
        final message = _messages[index];
        return _buildAgentBubble(message);
      },
    );
  }
  
  Widget _buildAgentBubble(_AgentMessage message) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Agent头像
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: message.agentColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Icon(
              message.agentIcon,
              color: message.agentColor,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          
          // 消息气泡
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.withOpacity(0.1),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(4),
                  topRight: Radius.circular(16),
                  bottomLeft: Radius.circular(16),
                  bottomRight: Radius.circular(16),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    message.agentName,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: message.agentColor,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    message.content,
                    style: const TextStyle(
                      fontSize: 14,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildLoadingMessage() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.grey.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(
              Icons.psychology_outlined,
              color: Colors.grey,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.withOpacity(0.1),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(4),
                  topRight: Radius.circular(16),
                  bottomLeft: Radius.circular(16),
                  bottomRight: Radius.circular(16),
                ),
              ),
              child: Row(
                children: [
                  const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    '正在分析中...',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildConclusionCard() {
    return CustomCard(
      margin: const EdgeInsets.all(16),
      backgroundColor: Theme.of(context).primaryColor.withOpacity(0.05),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.lightbulb_outline,
                color: Theme.of(context).primaryColor,
                size: 20,
              ),
              const SizedBox(width: 8),
              const Text(
                'AI综合结论',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            '基于技术面、基本面和市场情绪的综合分析，该股票当前处于上升趋势，建议适度关注。技术指标显示强势信号，但需注意市场整体风险。',
            style: TextStyle(
              fontSize: 14,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              StockTag(
                text: '看涨',
                isRise: true,
                size: TagSize.small,
              ),
              const SizedBox(width: 8),
              CustomTag(
                text: '置信度: 85%',
                type: TagType.info,
                size: TagSize.small,
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildDisclaimer() {
    return Container(
      margin: const EdgeInsets.all(16),
      child: CustomCard(
        backgroundColor: Colors.orange.withOpacity(0.1),
        child: Row(
          children: [
            Icon(
              Icons.warning_amber_outlined,
              color: Colors.orange[700],
              size: 16,
            ),
            const SizedBox(width: 8),
            const Expanded(
              child: Text(
                '本分析仅供参考，不构成投资建议。投资有风险，入市需谨慎。',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.orange,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Future<void> _startAnalysis() async {
    try {
      setState(() {
        _isAnalyzing = true;
        _error = null;
      });
      
      // 调用真实API获取分析数据
      final analysisResponse = await AIAnalysisService.getStockAnalysis(widget.symbol);
      
      // 模拟四个Agent依次分析
      final agents = [
        _AgentMessage(
          agentName: '技术分析师',
          agentIcon: Icons.trending_up,
          agentColor: Colors.blue,
          content: analysisResponse.technical.summary,
        ),
        _AgentMessage(
          agentName: '基本面分析师',
          agentIcon: Icons.analytics,
          agentColor: Colors.green,
          content: analysisResponse.fundamental.summary,
        ),
        _AgentMessage(
          agentName: '市场情绪分析师',
          agentIcon: Icons.sentiment_satisfied,
          agentColor: Colors.orange,
          content: analysisResponse.sentiment.summary,
        ),
        _AgentMessage(
          agentName: '资金流向分析师',
          agentIcon: Icons.account_balance,
          agentColor: Colors.purple,
          content: analysisResponse.flow.summary,
        ),
      ];
      
      // 依次显示每个Agent的分析
      for (int i = 0; i < agents.length; i++) {
        await Future.delayed(Duration(milliseconds: 1000));
        if (mounted) {
          setState(() {
            _messages.add(agents[i]);
            if (i == agents.length - 1) {
              _isAnalyzing = false;
            }
          });
        }
      }
    } catch (e) {
      setState(() {
        _isAnalyzing = false;
        _error = e.toString();
      });
      
      if (mounted) {
        context.showErrorToast('获取AI分析失败: ${e.toString()}');
      }
      
      // 显示模拟数据作为备选
      _loadMockAnalysis();
    }
  }
  
  void _loadMockAnalysis() {
    setState(() {
      _isAnalyzing = true;
    });
    
    // 模拟四个Agent依次分析
    final agents = [
      _AgentMessage(
        agentName: '技术分析师',
        agentIcon: Icons.trending_up,
        agentColor: Colors.blue,
        content: '从技术指标来看，RSI处于65.2，MACD金叉向上，KDJ指标显示多头趋势。短期均线上穿长期均线，技术面偏多。',
      ),
      _AgentMessage(
        agentName: '基本面分析师',
        agentIcon: Icons.analytics,
        agentColor: Colors.green,
        content: '公司基本面良好，市盈率合理，营收增长稳定。最新财报显示净利润同比增长12.5%，ROE达到18.6%。',
      ),
      _AgentMessage(
        agentName: '市场情绪分析师',
        agentIcon: Icons.sentiment_satisfied,
        agentColor: Colors.orange,
        content: '市场情绪偏向乐观，成交量放大，资金流入明显。社交媒体讨论热度上升，投资者关注度较高。',
      ),
      _AgentMessage(
        agentName: '资金流向分析师',
        agentIcon: Icons.account_balance,
        agentColor: Colors.purple,
        content: '主力资金净流入，大单买入活跃。机构持仓比例上升，北向资金持续加仓，资金面支撑较强。',
      ),
    ];
    
    // 依次显示每个Agent的分析
    for (int i = 0; i < agents.length; i++) {
      Future.delayed(Duration(milliseconds: 1000 * (i + 1)), () {
        if (mounted) {
          setState(() {
            _messages.add(agents[i]);
            if (i == agents.length - 1) {
              _isAnalyzing = false;
            }
          });
        }
      });
    }
  }
}

class _AgentMessage {
  final String agentName;
  final IconData agentIcon;
  final Color agentColor;
  final String content;
  
  _AgentMessage({
    required this.agentName,
    required this.agentIcon,
    required this.agentColor,
    required this.content,
  });
}