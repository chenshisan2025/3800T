import 'dart:convert';
import 'package:http/http.dart' as http;

/// API服务基类
class ApiService {
  static const String _baseUrl = 'http://localhost:3000'; // 开发环境API地址
  static const Duration _timeout = Duration(seconds: 30);
  
  static final Map<String, String> _defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  /// GET请求
  static Future<Map<String, dynamic>> get(
    String endpoint, {
    Map<String, String>? headers,
    Map<String, dynamic>? queryParams,
  }) async {
    try {
      final uri = _buildUri(endpoint, queryParams);
      final response = await http.get(
        uri,
        headers: {..._defaultHeaders, ...?headers},
      ).timeout(_timeout);
      
      return _handleResponse(response);
    } catch (e) {
      throw ApiException('GET请求失败: $e');
    }
  }

  /// POST请求
  static Future<Map<String, dynamic>> post(
    String endpoint, {
    Map<String, dynamic>? body,
    Map<String, String>? headers,
  }) async {
    try {
      final uri = _buildUri(endpoint);
      final response = await http.post(
        uri,
        headers: {..._defaultHeaders, ...?headers},
        body: body != null ? json.encode(body) : null,
      ).timeout(_timeout);
      
      return _handleResponse(response);
    } catch (e) {
      throw ApiException('POST请求失败: $e');
    }
  }

  /// 构建URI
  static Uri _buildUri(String endpoint, [Map<String, dynamic>? queryParams]) {
    final uri = Uri.parse('$_baseUrl$endpoint');
    if (queryParams != null && queryParams.isNotEmpty) {
      return uri.replace(queryParameters: queryParams.map(
        (key, value) => MapEntry(key, value.toString()),
      ));
    }
    return uri;
  }

  /// 处理响应
  static Map<String, dynamic> _handleResponse(http.Response response) {
    final statusCode = response.statusCode;
    
    if (statusCode >= 200 && statusCode < 300) {
      try {
        return json.decode(response.body) as Map<String, dynamic>;
      } catch (e) {
        throw ApiException('响应解析失败: $e');
      }
    } else {
      String errorMessage = 'HTTP错误: $statusCode';
      try {
        final errorBody = json.decode(response.body) as Map<String, dynamic>;
        errorMessage = errorBody['message'] ?? errorMessage;
      } catch (_) {
        // 忽略解析错误，使用默认错误消息
      }
      throw ApiException(errorMessage, statusCode: statusCode);
    }
  }
}

/// AI分析API服务
class AIAnalysisService {
  /// 获取股票AI分析
  static Future<AIAnalysisResponse> getStockAnalysis(String symbol) async {
    try {
      final response = await ApiService.post(
        '/api/ai/analyze',
        body: {
          'symbol': symbol,
          'analysisType': 'comprehensive', // 综合分析
        },
      );
      
      return AIAnalysisResponse.fromJson(response);
    } catch (e) {
      throw ApiException('获取AI分析失败: $e');
    }
  }

  /// 获取技术分析
  static Future<TechnicalAnalysis> getTechnicalAnalysis(String symbol) async {
    try {
      final response = await ApiService.post(
        '/api/ai/analyze',
        body: {
          'symbol': symbol,
          'analysisType': 'technical',
        },
      );
      
      return TechnicalAnalysis.fromJson(response['technical'] ?? {});
    } catch (e) {
      throw ApiException('获取技术分析失败: $e');
    }
  }

  /// 获取基本面分析
  static Future<FundamentalAnalysis> getFundamentalAnalysis(String symbol) async {
    try {
      final response = await ApiService.post(
        '/api/ai/analyze',
        body: {
          'symbol': symbol,
          'analysisType': 'fundamental',
        },
      );
      
      return FundamentalAnalysis.fromJson(response['fundamental'] ?? {});
    } catch (e) {
      throw ApiException('获取基本面分析失败: $e');
    }
  }

  /// 获取情绪分析
  static Future<SentimentAnalysis> getSentimentAnalysis(String symbol) async {
    try {
      final response = await ApiService.post(
        '/api/ai/analyze',
        body: {
          'symbol': symbol,
          'analysisType': 'sentiment',
        },
      );
      
      return SentimentAnalysis.fromJson(response['sentiment'] ?? {});
    } catch (e) {
      throw ApiException('获取情绪分析失败: $e');
    }
  }

  /// 获取资金流向分析
  static Future<FlowAnalysis> getFlowAnalysis(String symbol) async {
    try {
      final response = await ApiService.post(
        '/api/ai/analyze',
        body: {
          'symbol': symbol,
          'analysisType': 'flow',
        },
      );
      
      return FlowAnalysis.fromJson(response['flow'] ?? {});
    } catch (e) {
      throw ApiException('获取资金流向分析失败: $e');
    }
  }
}

/// API异常类
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  
  const ApiException(this.message, {this.statusCode});
  
  @override
  String toString() => 'ApiException: $message';
}

/// AI分析响应模型
class AIAnalysisResponse {
  final String symbol;
  final DateTime timestamp;
  final TechnicalAnalysis technical;
  final FundamentalAnalysis fundamental;
  final SentimentAnalysis sentiment;
  final FlowAnalysis flow;
  final AnalysisConclusion conclusion;

  const AIAnalysisResponse({
    required this.symbol,
    required this.timestamp,
    required this.technical,
    required this.fundamental,
    required this.sentiment,
    required this.flow,
    required this.conclusion,
  });

  factory AIAnalysisResponse.fromJson(Map<String, dynamic> json) {
    return AIAnalysisResponse(
      symbol: json['symbol'] ?? '',
      timestamp: DateTime.tryParse(json['timestamp'] ?? '') ?? DateTime.now(),
      technical: TechnicalAnalysis.fromJson(json['technical'] ?? {}),
      fundamental: FundamentalAnalysis.fromJson(json['fundamental'] ?? {}),
      sentiment: SentimentAnalysis.fromJson(json['sentiment'] ?? {}),
      flow: FlowAnalysis.fromJson(json['flow'] ?? {}),
      conclusion: AnalysisConclusion.fromJson(json['conclusion'] ?? {}),
    );
  }
}

/// 技术分析模型
class TechnicalAnalysis {
  final String signal; // 'buy', 'sell', 'hold'
  final double confidence;
  final String summary;
  final List<String> indicators;
  final Map<String, dynamic> details;

  const TechnicalAnalysis({
    required this.signal,
    required this.confidence,
    required this.summary,
    required this.indicators,
    required this.details,
  });

  factory TechnicalAnalysis.fromJson(Map<String, dynamic> json) {
    return TechnicalAnalysis(
      signal: json['signal'] ?? 'hold',
      confidence: (json['confidence'] ?? 0.0).toDouble(),
      summary: json['summary'] ?? '',
      indicators: List<String>.from(json['indicators'] ?? []),
      details: json['details'] ?? {},
    );
  }
}

/// 基本面分析模型
class FundamentalAnalysis {
  final String rating; // 'strong_buy', 'buy', 'hold', 'sell', 'strong_sell'
  final double score;
  final String summary;
  final Map<String, dynamic> metrics;
  final List<String> strengths;
  final List<String> weaknesses;

  const FundamentalAnalysis({
    required this.rating,
    required this.score,
    required this.summary,
    required this.metrics,
    required this.strengths,
    required this.weaknesses,
  });

  factory FundamentalAnalysis.fromJson(Map<String, dynamic> json) {
    return FundamentalAnalysis(
      rating: json['rating'] ?? 'hold',
      score: (json['score'] ?? 0.0).toDouble(),
      summary: json['summary'] ?? '',
      metrics: json['metrics'] ?? {},
      strengths: List<String>.from(json['strengths'] ?? []),
      weaknesses: List<String>.from(json['weaknesses'] ?? []),
    );
  }
}

/// 情绪分析模型
class SentimentAnalysis {
  final String sentiment; // 'positive', 'negative', 'neutral'
  final double score; // -1.0 to 1.0
  final String summary;
  final Map<String, int> sources; // 新闻来源统计
  final List<NewsItem> recentNews;

  const SentimentAnalysis({
    required this.sentiment,
    required this.score,
    required this.summary,
    required this.sources,
    required this.recentNews,
  });

  factory SentimentAnalysis.fromJson(Map<String, dynamic> json) {
    return SentimentAnalysis(
      sentiment: json['sentiment'] ?? 'neutral',
      score: (json['score'] ?? 0.0).toDouble(),
      summary: json['summary'] ?? '',
      sources: Map<String, int>.from(json['sources'] ?? {}),
      recentNews: (json['recentNews'] as List? ?? [])
          .map((item) => NewsItem.fromJson(item))
          .toList(),
    );
  }
}

/// 资金流向分析模型
class FlowAnalysis {
  final String trend; // 'inflow', 'outflow', 'balanced'
  final double netFlow; // 净流入金额
  final String summary;
  final Map<String, double> breakdown; // 大单、中单、小单分布
  final List<FlowData> history;

  const FlowAnalysis({
    required this.trend,
    required this.netFlow,
    required this.summary,
    required this.breakdown,
    required this.history,
  });

  factory FlowAnalysis.fromJson(Map<String, dynamic> json) {
    return FlowAnalysis(
      trend: json['trend'] ?? 'balanced',
      netFlow: (json['netFlow'] ?? 0.0).toDouble(),
      summary: json['summary'] ?? '',
      breakdown: Map<String, double>.from(json['breakdown'] ?? {}),
      history: (json['history'] as List? ?? [])
          .map((item) => FlowData.fromJson(item))
          .toList(),
    );
  }
}

/// 分析结论模型
class AnalysisConclusion {
  final String recommendation; // 'strong_buy', 'buy', 'hold', 'sell', 'strong_sell'
  final double confidence;
  final String summary;
  final List<String> keyPoints;
  final Map<String, double> riskFactors;
  final String timeHorizon; // 'short', 'medium', 'long'

  const AnalysisConclusion({
    required this.recommendation,
    required this.confidence,
    required this.summary,
    required this.keyPoints,
    required this.riskFactors,
    required this.timeHorizon,
  });

  factory AnalysisConclusion.fromJson(Map<String, dynamic> json) {
    return AnalysisConclusion(
      recommendation: json['recommendation'] ?? 'hold',
      confidence: (json['confidence'] ?? 0.0).toDouble(),
      summary: json['summary'] ?? '',
      keyPoints: List<String>.from(json['keyPoints'] ?? []),
      riskFactors: Map<String, double>.from(json['riskFactors'] ?? {}),
      timeHorizon: json['timeHorizon'] ?? 'medium',
    );
  }
}

/// 新闻项目模型
class NewsItem {
  final String title;
  final String summary;
  final String sentiment;
  final DateTime publishTime;
  final String source;

  const NewsItem({
    required this.title,
    required this.summary,
    required this.sentiment,
    required this.publishTime,
    required this.source,
  });

  factory NewsItem.fromJson(Map<String, dynamic> json) {
    return NewsItem(
      title: json['title'] ?? '',
      summary: json['summary'] ?? '',
      sentiment: json['sentiment'] ?? 'neutral',
      publishTime: DateTime.tryParse(json['publishTime'] ?? '') ?? DateTime.now(),
      source: json['source'] ?? '',
    );
  }
}

/// 资金流向数据模型
class FlowData {
  final DateTime time;
  final double inflow;
  final double outflow;
  final double netFlow;

  const FlowData({
    required this.time,
    required this.inflow,
    required this.outflow,
    required this.netFlow,
  });

  factory FlowData.fromJson(Map<String, dynamic> json) {
    return FlowData(
      time: DateTime.tryParse(json['time'] ?? '') ?? DateTime.now(),
      inflow: (json['inflow'] ?? 0.0).toDouble(),
      outflow: (json['outflow'] ?? 0.0).toDouble(),
      netFlow: (json['netFlow'] ?? 0.0).toDouble(),
    );
  }
}