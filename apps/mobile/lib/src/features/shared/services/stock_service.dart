import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';

import '../../../core/services/network_service.dart';
import '../../watchlist/widgets/stock_search_dialog.dart';
import '../../watchlist/models/watchlist_model.dart';

// 股票服务提供者
final stockServiceProvider = Provider<StockService>((ref) {
  final networkService = ref.read(networkServiceProvider);
  return StockService(networkService);
});

class StockService {
  final NetworkService _networkService;

  StockService(this._networkService);

  /// 搜索股票
  Future<List<StockSearchResult>> searchStocks(String query) async {
    try {
      final response = await _networkService.get(
        '/api/stocks/search',
        queryParameters: {
          'q': query,
          'limit': 20,
        },
      );

      if (response.data['success'] == true) {
        final List<dynamic> data = response.data['data'] ?? [];
        return data.map((item) => StockSearchResult.fromJson(item)).toList();
      } else {
        throw Exception(response.data['message'] ?? '搜索失败');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        return [];
      }
      throw Exception('网络请求失败: ${e.message}');
    } catch (e) {
      throw Exception('搜索失败: $e');
    }
  }

  /// 获取股票详情
  Future<StockDetail> getStockDetail(String symbol) async {
    try {
      final response = await _networkService.get('/api/stocks/$symbol');

      if (response.data['success'] == true) {
        return StockDetail.fromJson(response.data['data']);
      } else {
        throw Exception(response.data['message'] ?? '获取股票详情失败');
      }
    } on DioException catch (e) {
      throw Exception('网络请求失败: ${e.message}');
    } catch (e) {
      throw Exception('获取股票详情失败: $e');
    }
  }

  /// 获取股票实时报价
  Future<StockQuote> getStockQuote(String symbol) async {
    try {
      final response = await _networkService.get('/api/stocks/$symbol/quote');

      if (response.data['success'] == true) {
        return StockQuote.fromJson(response.data['data']);
      } else {
        throw Exception(response.data['message'] ?? '获取股票报价失败');
      }
    } on DioException catch (e) {
      throw Exception('网络请求失败: ${e.message}');
    } catch (e) {
      throw Exception('获取股票报价失败: $e');
    }
  }

  /// 获取多只股票的实时报价
  Future<List<StockQuote>> getBatchQuotes(List<String> symbols) async {
    if (symbols.isEmpty) return [];

    try {
      final response = await _networkService.post(
        '/api/stocks/quotes',
        data: {
          'symbols': symbols,
        },
      );

      if (response.data['success'] == true) {
        final List<dynamic> data = response.data['data'] ?? [];
        return data.map((item) => StockQuote.fromJson(item)).toList();
      } else {
        throw Exception(response.data['message'] ?? '获取股票报价失败');
      }
    } on DioException catch (e) {
      throw Exception('网络请求失败: ${e.message}');
    } catch (e) {
      throw Exception('获取股票报价失败: $e');
    }
  }

  /// 获取热门股票
  Future<List<StockSearchResult>> getHotStocks() async {
    try {
      final response = await _networkService.get('/api/stocks/hot');

      if (response.data['success'] == true) {
        final List<dynamic> data = response.data['data'] ?? [];
        return data.map((item) => StockSearchResult.fromJson(item)).toList();
      } else {
        throw Exception(response.data['message'] ?? '获取热门股票失败');
      }
    } on DioException catch (e) {
      throw Exception('网络请求失败: ${e.message}');
    } catch (e) {
      throw Exception('获取热门股票失败: $e');
    }
  }

  /// 获取股票历史数据
  Future<List<StockHistoryData>> getStockHistory(
    String symbol, {
    String period = '1d',
    int limit = 100,
  }) async {
    try {
      final response = await _networkService.get(
        '/api/stocks/$symbol/history',
        queryParameters: {
          'period': period,
          'limit': limit,
        },
      );

      if (response.data['success'] == true) {
        final List<dynamic> data = response.data['data'] ?? [];
        return data.map((item) => StockHistoryData.fromJson(item)).toList();
      } else {
        throw Exception(response.data['message'] ?? '获取历史数据失败');
      }
    } on DioException catch (e) {
      throw Exception('网络请求失败: ${e.message}');
    } catch (e) {
      throw Exception('获取历史数据失败: $e');
    }
  }
}

// 股票详情模型
class StockDetail {
  final String symbol;
  final String name;
  final String fullName;
  final MarketType market;
  final String industry;
  final String description;
  final double? marketCap;
  final double? pe;
  final double? pb;
  final double? dividend;
  final StockQuote? quote;

  StockDetail({
    required this.symbol,
    required this.name,
    required this.fullName,
    required this.market,
    required this.industry,
    required this.description,
    this.marketCap,
    this.pe,
    this.pb,
    this.dividend,
    this.quote,
  });

  factory StockDetail.fromJson(Map<String, dynamic> json) {
    return StockDetail(
      symbol: json['symbol'] ?? '',
      name: json['name'] ?? '',
      fullName: json['fullName'] ?? '',
      market: MarketType.values.firstWhere(
        (e) => e.name == json['market'],
        orElse: () => MarketType.sh,
      ),
      industry: json['industry'] ?? '',
      description: json['description'] ?? '',
      marketCap: json['marketCap']?.toDouble(),
      pe: json['pe']?.toDouble(),
      pb: json['pb']?.toDouble(),
      dividend: json['dividend']?.toDouble(),
      quote: json['quote'] != null ? StockQuote.fromJson(json['quote']) : null,
    );
  }
}

// 股票历史数据模型
class StockHistoryData {
  final DateTime date;
  final double open;
  final double high;
  final double low;
  final double close;
  final int volume;
  final double amount;

  StockHistoryData({
    required this.date,
    required this.open,
    required this.high,
    required this.low,
    required this.close,
    required this.volume,
    required this.amount,
  });

  factory StockHistoryData.fromJson(Map<String, dynamic> json) {
    return StockHistoryData(
      date: DateTime.parse(json['date']),
      open: json['open']?.toDouble() ?? 0.0,
      high: json['high']?.toDouble() ?? 0.0,
      low: json['low']?.toDouble() ?? 0.0,
      close: json['close']?.toDouble() ?? 0.0,
      volume: json['volume']?.toInt() ?? 0,
      amount: json['amount']?.toDouble() ?? 0.0,
    );
  }
}