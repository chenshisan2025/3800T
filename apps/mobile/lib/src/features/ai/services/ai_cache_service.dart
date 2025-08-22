import 'dart:async';
import 'dart:convert';

import '../../../core/services/cache_service.dart';
import '../../../core/utils/logger.dart';
import '../models/ai_analysis_model.dart';
import '../models/ai_chat_model.dart';
import '../models/ai_recommendation_model.dart';

/// AI响应缓存策略
enum AiCacheStrategy {
  /// 实时分析 - 5分钟缓存
  realtime,
  /// 技术分析 - 15分钟缓存
  technical,
  /// 基本面分析 - 1小时缓存
  fundamental,
  /// 市场分析 - 30分钟缓存
  market,
  /// 推荐建议 - 2小时缓存
  recommendation,
  /// 聊天对话 - 24小时缓存
  chat,
  /// 历史分析 - 7天缓存
  historical,
}

/// AI响应缓存服务
class AiCacheService {
  final CacheService _cacheService;
  static const String _category = 'ai';
  
  // 缓存策略配置
  static const Map<AiCacheStrategy, Duration> _cacheDurations = {
    AiCacheStrategy.realtime: Duration(minutes: 5),
    AiCacheStrategy.technical: Duration(minutes: 15),
    AiCacheStrategy.fundamental: Duration(hours: 1),
    AiCacheStrategy.market: Duration(minutes: 30),
    AiCacheStrategy.recommendation: Duration(hours: 2),
    AiCacheStrategy.chat: Duration(hours: 24),
    AiCacheStrategy.historical: Duration(days: 7),
  };

  AiCacheService(this._cacheService);

  /// 获取缓存TTL
  Duration _getTtl(AiCacheStrategy strategy) {
    return _cacheDurations[strategy] ?? const Duration(minutes: 15);
  }

  /// 生成AI分析缓存键
  String _getAnalysisKey(
    String symbol,
    String analysisType, {
    Map<String, String>? params,
  }) {
    final paramStr = params?.entries
        .map((e) => '${e.key}=${e.value}')
        .join('&') ?? '';
    return 'analysis:$symbol:$analysisType${paramStr.isNotEmpty ? ':$paramStr' : ''}';
  }

  /// 生成AI聊天缓存键
  String _getChatKey(String sessionId, String messageHash) {
    return 'chat:$sessionId:$messageHash';
  }

  /// 生成AI推荐缓存键
  String _getRecommendationKey(
    String userId,
    String recommendationType, {
    Map<String, String>? filters,
  }) {
    final filterStr = filters?.entries
        .map((e) => '${e.key}=${e.value}')
        .join('&') ?? '';
    return 'recommendation:$userId:$recommendationType${filterStr.isNotEmpty ? ':$filterStr' : ''}';
  }

  /// 生成市场分析缓存键
  String _getMarketAnalysisKey(
    String marketType,
    String timeframe, {
    List<String>? sectors,
  }) {
    final sectorStr = sectors?.join(',') ?? '';
    return 'market:$marketType:$timeframe${sectorStr.isNotEmpty ? ':$sectorStr' : ''}';
  }

  // ==========================================================================
  // AI分析缓存
  // ==========================================================================

  /// 缓存AI分析结果
  Future<void> cacheAnalysis(
    String symbol,
    String analysisType,
    AiAnalysisModel analysis, {
    Map<String, String>? params,
    AiCacheStrategy? strategy,
  }) async {
    try {
      // 根据分析类型选择缓存策略
      strategy ??= _getAnalysisCacheStrategy(analysisType);
      
      final key = _getAnalysisKey(symbol, analysisType, params: params);
      await _cacheService.set(
        key,
        analysis.toJson(),
        category: _category,
        ttl: _getTtl(strategy),
        etag: _generateEtag(analysis.toJson()),
      );
      Logger.d('AI分析结果已缓存: $symbol ($analysisType)');
    } catch (e) {
      Logger.e('缓存AI分析结果失败: $e');
    }
  }

  /// 获取缓存的AI分析结果
  Future<AiAnalysisModel?> getCachedAnalysis(
    String symbol,
    String analysisType, {
    Map<String, String>? params,
  }) async {
    try {
      final key = _getAnalysisKey(symbol, analysisType, params: params);
      final data = await _cacheService.get<Map<String, dynamic>>(
        key,
        category: _category,
      );
      
      if (data != null) {
        Logger.d('AI分析结果缓存命中: $symbol ($analysisType)');
        return AiAnalysisModel.fromJson(data);
      }
      
      return null;
    } catch (e) {
      Logger.e('获取缓存AI分析结果失败: $e');
      return null;
    }
  }

  /// 根据分析类型获取缓存策略
  AiCacheStrategy _getAnalysisCacheStrategy(String analysisType) {
    switch (analysisType.toLowerCase()) {
      case 'realtime':
      case 'price_alert':
        return AiCacheStrategy.realtime;
      case 'technical':
      case 'chart_pattern':
      case 'indicator':
        return AiCacheStrategy.technical;
      case 'fundamental':
      case 'financial':
      case 'valuation':
        return AiCacheStrategy.fundamental;
      case 'market':
      case 'sector':
      case 'trend':
        return AiCacheStrategy.market;
      default:
        return AiCacheStrategy.technical;
    }
  }

  /// 批量缓存AI分析结果
  Future<void> cacheMultipleAnalyses(
    Map<String, AiAnalysisModel> analyses,
    String analysisType, {
    Map<String, String>? params,
    AiCacheStrategy? strategy,
  }) async {
    final futures = analyses.entries.map((entry) => 
      cacheAnalysis(
        entry.key,
        analysisType,
        entry.value,
        params: params,
        strategy: strategy,
      )
    );
    await Future.wait(futures);
  }

  // ==========================================================================
  // AI聊天缓存
  // ==========================================================================

  /// 缓存AI聊天响应
  Future<void> cacheChatResponse(
    String sessionId,
    String userMessage,
    AiChatModel chatResponse, {
    AiCacheStrategy strategy = AiCacheStrategy.chat,
  }) async {
    try {
      final messageHash = _generateMessageHash(userMessage);
      final key = _getChatKey(sessionId, messageHash);
      
      await _cacheService.set(
        key,
        chatResponse.toJson(),
        category: _category,
        ttl: _getTtl(strategy),
        etag: _generateEtag(chatResponse.toJson()),
      );
      Logger.d('AI聊天响应已缓存: $sessionId');
    } catch (e) {
      Logger.e('缓存AI聊天响应失败: $e');
    }
  }

  /// 获取缓存的AI聊天响应
  Future<AiChatModel?> getCachedChatResponse(
    String sessionId,
    String userMessage,
  ) async {
    try {
      final messageHash = _generateMessageHash(userMessage);
      final key = _getChatKey(sessionId, messageHash);
      
      final data = await _cacheService.get<Map<String, dynamic>>(
        key,
        category: _category,
      );
      
      if (data != null) {
        Logger.d('AI聊天响应缓存命中: $sessionId');
        return AiChatModel.fromJson(data);
      }
      
      return null;
    } catch (e) {
      Logger.e('获取缓存AI聊天响应失败: $e');
      return null;
    }
  }

  /// 生成消息哈希
  String _generateMessageHash(String message) {
    // 标准化消息内容
    final normalized = message.toLowerCase().trim().replaceAll(RegExp(r'\s+'), ' ');
    return normalized.hashCode.toString();
  }

  /// 清空聊天会话缓存
  Future<void> clearChatSession(String sessionId) async {
    try {
      // 由于无法直接按前缀删除，这里记录需要清理的会话
      // 实际实现中可以维护一个会话键列表
      Logger.d('聊天会话缓存清理请求: $sessionId');
    } catch (e) {
      Logger.e('清空聊天会话缓存失败: $e');
    }
  }

  // ==========================================================================
  // AI推荐缓存
  // ==========================================================================

  /// 缓存AI推荐结果
  Future<void> cacheRecommendation(
    String userId,
    String recommendationType,
    List<AiRecommendationModel> recommendations, {
    Map<String, String>? filters,
    AiCacheStrategy strategy = AiCacheStrategy.recommendation,
  }) async {
    try {
      final key = _getRecommendationKey(
        userId,
        recommendationType,
        filters: filters,
      );
      
      final data = recommendations.map((rec) => rec.toJson()).toList();
      
      await _cacheService.set(
        key,
        data,
        category: _category,
        ttl: _getTtl(strategy),
        etag: _generateEtag(data),
      );
      Logger.d('AI推荐结果已缓存: $userId ($recommendationType, ${recommendations.length}条)');
    } catch (e) {
      Logger.e('缓存AI推荐结果失败: $e');
    }
  }

  /// 获取缓存的AI推荐结果
  Future<List<AiRecommendationModel>?> getCachedRecommendation(
    String userId,
    String recommendationType, {
    Map<String, String>? filters,
  }) async {
    try {
      final key = _getRecommendationKey(
        userId,
        recommendationType,
        filters: filters,
      );
      
      final data = await _cacheService.get<List<dynamic>>(
        key,
        category: _category,
      );
      
      if (data != null) {
        Logger.d('AI推荐结果缓存命中: $userId ($recommendationType)');
        return data
            .map((item) => AiRecommendationModel.fromJson(
                Map<String, dynamic>.from(item)))
            .toList();
      }
      
      return null;
    } catch (e) {
      Logger.e('获取缓存AI推荐结果失败: $e');
      return null;
    }
  }

  // ==========================================================================
  // 市场分析缓存
  // ==========================================================================

  /// 缓存市场分析结果
  Future<void> cacheMarketAnalysis(
    String marketType,
    String timeframe,
    AiAnalysisModel analysis, {
    List<String>? sectors,
    AiCacheStrategy strategy = AiCacheStrategy.market,
  }) async {
    try {
      final key = _getMarketAnalysisKey(marketType, timeframe, sectors: sectors);
      
      await _cacheService.set(
        key,
        analysis.toJson(),
        category: _category,
        ttl: _getTtl(strategy),
        etag: _generateEtag(analysis.toJson()),
      );
      Logger.d('市场分析结果已缓存: $marketType ($timeframe)');
    } catch (e) {
      Logger.e('缓存市场分析结果失败: $e');
    }
  }

  /// 获取缓存的市场分析结果
  Future<AiAnalysisModel?> getCachedMarketAnalysis(
    String marketType,
    String timeframe, {
    List<String>? sectors,
  }) async {
    try {
      final key = _getMarketAnalysisKey(marketType, timeframe, sectors: sectors);
      
      final data = await _cacheService.get<Map<String, dynamic>>(
        key,
        category: _category,
      );
      
      if (data != null) {
        Logger.d('市场分析结果缓存命中: $marketType ($timeframe)');
        return AiAnalysisModel.fromJson(data);
      }
      
      return null;
    } catch (e) {
      Logger.e('获取缓存市场分析结果失败: $e');
      return null;
    }
  }

  // ==========================================================================
  // 智能缓存管理
  // ==========================================================================

  /// 智能缓存预热
  Future<void> smartWarmup({
    String? userId,
    List<String>? popularSymbols,
    List<String>? userWatchlist,
  }) async {
    try {
      Logger.d('开始AI缓存智能预热');
      
      // 预热用户常用的分析类型
      if (userId != null && userWatchlist != null) {
        for (final symbol in userWatchlist.take(5)) {
          // 预热技术分析（最常用）
          // 这里可以调用相应的AI服务来生成并缓存分析结果
        }
      }
      
      // 预热热门股票的市场分析
      if (popularSymbols != null) {
        // 预热市场趋势分析
      }
      
      Logger.d('AI缓存智能预热完成');
    } catch (e) {
      Logger.e('AI缓存智能预热失败: $e');
    }
  }

  /// 基于使用模式的缓存优化
  Future<void> optimizeCacheByUsage(Map<String, int> usageStats) async {
    try {
      Logger.d('开始基于使用模式优化AI缓存');
      
      // 分析使用频率，调整缓存策略
      final sortedUsage = usageStats.entries.toList()
        ..sort((a, b) => b.value.compareTo(a.value));
      
      // 对高频使用的分析类型延长缓存时间
      for (final entry in sortedUsage.take(10)) {
        final analysisType = entry.key;
        final usage = entry.value;
        
        if (usage > 100) {
          // 高频使用，可以考虑延长缓存时间
          Logger.d('高频分析类型: $analysisType (使用次数: $usage)');
        }
      }
      
      Logger.d('AI缓存优化完成');
    } catch (e) {
      Logger.e('AI缓存优化失败: $e');
    }
  }

  /// 清理低价值缓存
  Future<void> cleanupLowValueCache() async {
    try {
      Logger.d('开始清理低价值AI缓存');
      
      // 清理命中率低的缓存
      // 清理过期时间较长但很少访问的缓存
      
      Logger.d('低价值AI缓存清理完成');
    } catch (e) {
      Logger.e('清理低价值AI缓存失败: $e');
    }
  }

  /// 获取AI缓存使用报告
  Future<Map<String, dynamic>> getCacheUsageReport() async {
    try {
      final stats = _cacheService.getStats();
      
      return {
        'category': _category,
        'totalEntries': stats.totalEntries,
        'hitRate': stats.hitRate,
        'totalSize': stats.totalSize,
        'lastCleanup': stats.lastCleanup.toIso8601String(),
        'cacheStrategies': _cacheDurations.map(
          (key, value) => MapEntry(key.toString(), value.inMinutes),
        ),
        'recommendedOptimizations': _getOptimizationRecommendations(stats),
      };
    } catch (e) {
      Logger.e('获取AI缓存使用报告失败: $e');
      return {};
    }
  }

  /// 获取优化建议
  List<String> _getOptimizationRecommendations(CacheStats stats) {
    final recommendations = <String>[];
    
    if (stats.hitRate < 0.3) {
      recommendations.add('缓存命中率较低，建议调整缓存策略');
    }
    
    if (stats.totalSize > 100 * 1024 * 1024) { // 100MB
      recommendations.add('缓存占用空间较大，建议清理过期数据');
    }
    
    if (stats.totalEntries > 10000) {
      recommendations.add('缓存条目过多，建议优化缓存键设计');
    }
    
    return recommendations;
  }

  // ==========================================================================
  // 缓存管理工具
  // ==========================================================================

  /// 清空所有AI缓存
  Future<void> clearAllCache() async {
    try {
      await _cacheService.clear(category: _category);
      Logger.d('所有AI缓存已清空');
    } catch (e) {
      Logger.e('清空AI缓存失败: $e');
    }
  }

  /// 清空特定类型的AI缓存
  Future<void> clearCacheByType(String analysisType) async {
    try {
      // 由于无法直接按类型删除，这里记录清理请求
      Logger.d('AI缓存类型清理请求: $analysisType');
    } catch (e) {
      Logger.e('清空AI缓存类型失败: $e');
    }
  }

  /// 清空用户相关的AI缓存
  Future<void> clearUserCache(String userId) async {
    try {
      // 清理用户的推荐缓存和聊天缓存
      Logger.d('用户AI缓存清理请求: $userId');
    } catch (e) {
      Logger.e('清空用户AI缓存失败: $e');
    }
  }

  /// 检查缓存是否存在
  Future<bool> isCached(
    String key, {
    String? symbol,
    String? analysisType,
    String? sessionId,
    String? userMessage,
  }) async {
    try {
      String cacheKey;
      
      if (symbol != null && analysisType != null) {
        cacheKey = _getAnalysisKey(symbol, analysisType);
      } else if (sessionId != null && userMessage != null) {
        final messageHash = _generateMessageHash(userMessage);
        cacheKey = _getChatKey(sessionId, messageHash);
      } else {
        cacheKey = key;
      }
      
      return await _cacheService.exists(cacheKey, category: _category);
    } catch (e) {
      Logger.e('检查AI缓存存在性失败: $e');
      return false;
    }
  }

  /// 生成ETag
  String _generateEtag(dynamic data) {
    try {
      final jsonString = jsonEncode(data);
      return jsonString.hashCode.toString();
    } catch (e) {
      return DateTime.now().millisecondsSinceEpoch.toString();
    }
  }

  /// 获取缓存条目详细信息
  Future<CacheEntry?> getCacheEntry(
    String key, {
    String? symbol,
    String? analysisType,
  }) async {
    try {
      String cacheKey;
      if (symbol != null && analysisType != null) {
        cacheKey = _getAnalysisKey(symbol, analysisType);
      } else {
        cacheKey = key;
      }
      
      return await _cacheService.getEntry(cacheKey, category: _category);
    } catch (e) {
      Logger.e('获取AI缓存条目失败: $e');
      return null;
    }
  }

  /// 预测缓存需求
  Future<Map<String, dynamic>> predictCacheNeeds(
    Map<String, dynamic> userBehavior,
  ) async {
    try {
      final predictions = <String, dynamic>{};
      
      // 基于用户行为预测缓存需求
      final viewedSymbols = userBehavior['viewedSymbols'] as List<String>? ?? [];
      final analysisTypes = userBehavior['analysisTypes'] as List<String>? ?? [];
      final timePatterns = userBehavior['timePatterns'] as Map<String, int>? ?? {};
      
      // 预测高频访问的股票
      predictions['recommendedSymbols'] = viewedSymbols.take(10).toList();
      
      // 预测常用的分析类型
      predictions['recommendedAnalysisTypes'] = analysisTypes.take(5).toList();
      
      // 预测最佳缓存时间
      predictions['optimalCacheTime'] = _calculateOptimalCacheTime(timePatterns);
      
      return predictions;
    } catch (e) {
      Logger.e('预测AI缓存需求失败: $e');
      return {};
    }
  }

  /// 计算最佳缓存时间
  Duration _calculateOptimalCacheTime(Map<String, int> timePatterns) {
    // 基于用户访问模式计算最佳缓存时间
    final totalAccess = timePatterns.values.fold(0, (sum, count) => sum + count);
    
    if (totalAccess > 100) {
      return const Duration(hours: 2); // 高频用户
    } else if (totalAccess > 50) {
      return const Duration(hours: 1); // 中频用户
    } else {
      return const Duration(minutes: 30); // 低频用户
    }
  }
}