import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_config.dart';
import '../storage/storage_service.dart';
import '../utils/logger.dart';

/// 网络服务提供者
final networkServiceProvider = Provider<NetworkService>((ref) {
  final storageService = ref.watch(storageServiceProvider);
  return NetworkService(storageService);
});

/// 网络服务类
class NetworkService {
  late final Dio _dio;
  final StorageService _storageService;
  
  NetworkService(this._storageService) {
    _dio = Dio();
    _setupInterceptors();
    _setupOptions();
  }
  
  /// 获取 Dio 实例
  Dio get dio => _dio;
  
  /// 设置基础配置
  void _setupOptions() {
    _dio.options = BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: Duration(milliseconds: AppConfig.connectTimeout),
      receiveTimeout: Duration(milliseconds: AppConfig.receiveTimeout),
      sendTimeout: Duration(milliseconds: AppConfig.sendTimeout),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    );
  }
  
  /// 设置拦截器
  void _setupInterceptors() {
    // 请求拦截器
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // 添加认证 token
          final token = await _storageService.getToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          
          // 添加设备信息
          options.headers['X-Device-Platform'] = defaultTargetPlatform.name;
          options.headers['X-App-Version'] = AppConfig.appVersion;
          
          // 日志记录
          if (kDebugMode) {
            Logger.d('请求: ${options.method} ${options.uri}');
            if (options.data != null) {
              Logger.d('请求数据: ${options.data}');
            }
          }
          
          handler.next(options);
        },
        
        onResponse: (response, handler) {
          // 响应日志
          if (kDebugMode) {
            Logger.d('响应: ${response.statusCode} ${response.requestOptions.uri}');
            Logger.d('响应数据: ${response.data}');
          }
          
          handler.next(response);
        },
        
        onError: (error, handler) async {
          // 错误日志
          Logger.e('网络错误: ${error.message}', error: error);
          
          // 处理 401 未授权错误
          if (error.response?.statusCode == 401) {
            await _handleUnauthorized();
          }
          
          // 处理网络错误
          final networkError = _handleNetworkError(error);
          handler.next(networkError);
        },
      ),
    );
    
    // 重试拦截器
    _dio.interceptors.add(
      RetryInterceptor(
        dio: _dio,
        retries: 3,
        retryDelays: const [
          Duration(seconds: 1),
          Duration(seconds: 2),
          Duration(seconds: 3),
        ],
      ),
    );
    
    // 缓存拦截器（仅在生产环境）
    if (!kDebugMode) {
      _dio.interceptors.add(
        CacheInterceptor(
          maxAge: Duration(minutes: AppConfig.cacheMaxAge),
        ),
      );
    }
  }
  
  /// 处理未授权错误
  Future<void> _handleUnauthorized() async {
    await _storageService.clearToken();
    await _storageService.clearUserData();
    // 这里可以发送事件通知 UI 跳转到登录页
  }
  
  /// 处理网络错误
  DioException _handleNetworkError(DioException error) {
    String message;
    
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        message = '网络连接超时，请检查网络设置';
        break;
      case DioExceptionType.badResponse:
        message = _getErrorMessage(error.response?.statusCode);
        break;
      case DioExceptionType.cancel:
        message = '请求已取消';
        break;
      case DioExceptionType.unknown:
        message = '网络连接失败，请检查网络设置';
        break;
      default:
        message = '未知网络错误';
    }
    
    return DioException(
      requestOptions: error.requestOptions,
      response: error.response,
      type: error.type,
      error: message,
      message: message,
    );
  }
  
  /// 根据状态码获取错误信息
  String _getErrorMessage(int? statusCode) {
    switch (statusCode) {
      case 400:
        return '请求参数错误';
      case 401:
        return '未授权，请重新登录';
      case 403:
        return '访问被拒绝';
      case 404:
        return '请求的资源不存在';
      case 500:
        return '服务器内部错误';
      case 502:
        return '网关错误';
      case 503:
        return '服务暂时不可用';
      default:
        return '网络请求失败（$statusCode）';
    }
  }
  
  /// GET 请求
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) {
    return _dio.get<T>(
      path,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }
  
  /// POST 请求
  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) {
    return _dio.post<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }
  
  /// PUT 请求
  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) {
    return _dio.put<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }
  
  /// DELETE 请求
  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) {
    return _dio.delete<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }

  /// PATCH 请求
  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) {
    return _dio.patch<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }
  
  /// 上传文件
  Future<Response<T>> upload<T>(
    String path,
    FormData formData, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onSendProgress,
  }) {
    return _dio.post<T>(
      path,
      data: formData,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
      onSendProgress: onSendProgress,
    );
  }
  
  /// 下载文件
  Future<Response> download(
    String urlPath,
    String savePath, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onReceiveProgress,
  }) {
    return _dio.download(
      urlPath,
      savePath,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
      onReceiveProgress: onReceiveProgress,
    );
  }
}

/// 重试拦截器
class RetryInterceptor extends Interceptor {
  final Dio dio;
  final int retries;
  final List<Duration> retryDelays;
  
  RetryInterceptor({
    required this.dio,
    this.retries = 3,
    this.retryDelays = const [
      Duration(seconds: 1),
      Duration(seconds: 2),
      Duration(seconds: 3),
    ],
  });
  
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    final extra = err.requestOptions.extra;
    final retryCount = extra['retryCount'] ?? 0;
    
    if (retryCount < retries && _shouldRetry(err)) {
      extra['retryCount'] = retryCount + 1;
      
      final delay = retryDelays.length > retryCount 
          ? retryDelays[retryCount] 
          : retryDelays.last;
      
      await Future.delayed(delay);
      
      try {
        final response = await dio.fetch(err.requestOptions);
        handler.resolve(response);
        return;
      } catch (e) {
        // 继续重试或返回错误
      }
    }
    
    handler.next(err);
  }
  
  bool _shouldRetry(DioException err) {
    return err.type == DioExceptionType.connectionTimeout ||
           err.type == DioExceptionType.sendTimeout ||
           err.type == DioExceptionType.receiveTimeout ||
           (err.response?.statusCode != null && 
            err.response!.statusCode! >= 500);
  }
}

/// 缓存拦截器
class CacheInterceptor extends Interceptor {
  final Duration maxAge;
  final Map<String, CacheItem> _cache = {};
  
  CacheInterceptor({required this.maxAge});
  
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.method.toUpperCase() == 'GET') {
      final key = _getCacheKey(options);
      final cacheItem = _cache[key];
      
      if (cacheItem != null && !cacheItem.isExpired) {
        handler.resolve(cacheItem.response);
        return;
      }
    }
    
    handler.next(options);
  }
  
  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    if (response.requestOptions.method.toUpperCase() == 'GET' &&
        response.statusCode == 200) {
      final key = _getCacheKey(response.requestOptions);
      _cache[key] = CacheItem(
        response: response,
        expireTime: DateTime.now().add(maxAge),
      );
    }
    
    handler.next(response);
  }
  
  String _getCacheKey(RequestOptions options) {
    return '${options.uri}';
  }
}

/// 缓存项
class CacheItem {
  final Response response;
  final DateTime expireTime;
  
  CacheItem({
    required this.response,
    required this.expireTime,
  });
  
  bool get isExpired => DateTime.now().isAfter(expireTime);
}