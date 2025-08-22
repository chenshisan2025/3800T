import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

import '../config/app_config.dart';
import '../storage/storage_service.dart';
import '../utils/logger.dart';
import 'network_interceptors.dart';
import 'dart:async';
import 'dart:collection';

/// 网络服务提供者
final networkServiceProvider = Provider<NetworkService>((ref) {
  final storageService = ref.watch(storageServiceProvider);
  return NetworkService(storageService);
});

/// 网络服务类
class NetworkService {
  late final Dio _dio;
  final StorageService _storageService;
  final Connectivity _connectivity = Connectivity();
  
  // 请求队列管理
  final Queue<RequestOptions> _requestQueue = Queue<RequestOptions>();
  final Map<String, Completer<Response>> _pendingRequests = {};
  bool _isProcessingQueue = false;
  int _maxConcurrentRequests = 3;
  int _currentRequests = 0;
  
  // 网络状态
  bool _isOnline = true;
  StreamSubscription<ConnectivityResult>? _connectivitySubscription;
  
  // 并发控制
  int _currentActiveRequests = 0;
  final Queue<Completer<void>> _concurrencyQueue = Queue<Completer<void>>();
  
  NetworkService(this._storageService) {
    _dio = Dio();
    _setupInterceptors();
    _setupOptions();
    _setupConnectivityListener();
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
    // 统一请求拦截器
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // 检查网络连接
          if (!_isOnline) {
            handler.reject(DioException(
              requestOptions: options,
              type: DioExceptionType.connectionError,
              message: '网络连接不可用，请检查网络设置',
            ));
            return;
          }

          // 添加认证 token
          final token = await _storageService.getToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          
          // 添加设备信息
          options.headers['X-Device-Platform'] = defaultTargetPlatform.name;
          options.headers['X-App-Version'] = AppConfig.appVersion;
          options.headers['User-Agent'] = 'GuLingTong-Mobile/1.0.0';
          
          // 添加请求追踪ID
          options.headers['X-Request-ID'] = _generateRequestId();
          options.headers['X-Timestamp'] = DateTime.now().millisecondsSinceEpoch.toString();
          
          // 日志记录
          if (kDebugMode) {
            Logger.d('🚀 请求: ${options.method} ${options.uri}');
            Logger.d('📋 Headers: ${options.headers}');
            if (options.data != null) {
              Logger.d('📦 请求数据: ${options.data}');
            }
          }
          
          handler.next(options);
        },
        
        onResponse: (response, handler) {
          final duration = _calculateRequestDuration(response.requestOptions);
          // 响应日志
          if (kDebugMode) {
            Logger.d('✅ 响应: ${response.statusCode} ${response.requestOptions.uri} (${duration}ms)');
            Logger.d('📄 响应数据: ${response.data}');
          }
          
          // 记录成功请求的性能指标
          _recordRequestMetrics(response.requestOptions, response.statusCode!, duration);
          
          handler.next(response);
        },
        
        onError: (error, handler) async {
          final duration = _calculateRequestDuration(error.requestOptions);
          // 错误日志
          Logger.e('❌ 网络错误: ${error.message} (${duration}ms)', error: error);
          Logger.e('🔍 错误响应: ${error.response?.data}');
          
          // 处理 401 未授权错误
          if (error.response?.statusCode == 401) {
            await _handleUnauthorized();
          }
          
          // 统一错误处理和映射
          final networkError = await _mapError(error);
          
          // 记录失败请求的性能指标
          _recordRequestMetrics(error.requestOptions, error.response?.statusCode ?? 0, duration);
          
          handler.next(networkError);
        },
      ),
    );
    
    // 增强重试拦截器
    _dio.interceptors.add(EnhancedRetryInterceptor(
      dio: _dio,
      retries: 3,
      retryDelays: const [Duration(seconds: 1), Duration(seconds: 2), Duration(seconds: 3)],
      retryEvaluator: _shouldRetry,
    ));

    // 智能缓存拦截器
    _dio.interceptors.add(SmartCacheInterceptor());
    
    // 请求队列拦截器
    _dio.interceptors.add(QueueInterceptor(
      onRequestCallback: _handleQueuedRequest,
    ));
  }
  
  /// 设置网络连接监听
  void _setupConnectivityListener() {
    _connectivitySubscription = _connectivity.onConnectivityChanged.listen((result) async {
      final wasOnline = _isOnline;
      _isOnline = result != ConnectivityResult.none;
      
      Logger.d('🌐 网络状态变化: ${_isOnline ? "在线" : "离线"}');
      
      // 网络恢复时处理队列中的请求
      if (!wasOnline && _isOnline && _requestQueue.isNotEmpty) {
        Logger.d('📡 网络已恢复，处理 ${_requestQueue.length} 个排队请求');
        await _processRequestQueue();
      }
      
      // 网络断开时清理当前请求
      if (wasOnline && !_isOnline) {
        Logger.w('📵 网络已断开，新请求将进入队列');
        await _handleNetworkDisconnection();
      }
    });
    
    // 初始化时检查网络状态
    _checkInitialConnectivity();
  }
  
  /// 检查初始网络连接状态
  Future<void> _checkInitialConnectivity() async {
    try {
      final result = await _connectivity.checkConnectivity();
      _isOnline = result != ConnectivityResult.none;
      Logger.d('初始网络状态: ${_isOnline ? "在线" : "离线"} ($result)');
    } catch (e) {
      Logger.e('检查网络状态失败: $e');
      _isOnline = false;
    }
  }
  
  /// 处理网络断开
  Future<void> _handleNetworkDisconnection() async {
    try {
      // 保存当前未完成的请求状态
      await _storageService.save('network_box', 'offline_timestamp', DateTime.now().toIso8601String());
      await _storageService.save('network_box', 'pending_requests_count', _pendingRequests.length);
      
      Logger.d('网络断开，已保存 ${_pendingRequests.length} 个待处理请求');
    } catch (e) {
      Logger.e('处理网络断开失败: $e');
    }
  }
  
  /// 生成请求ID
  String _generateRequestId() {
    return DateTime.now().millisecondsSinceEpoch.toString();
  }
  
  /// 计算请求耗时
  int _calculateRequestDuration(RequestOptions options) {
    final startTime = options.extra['startTime'] as int? ?? DateTime.now().millisecondsSinceEpoch;
    return DateTime.now().millisecondsSinceEpoch - startTime;
  }
  
  /// 记录请求性能指标
  void _recordRequestMetrics(RequestOptions options, int statusCode, int duration) {
    // 这里可以添加性能监控逻辑
    if (kDebugMode) {
      Logger.d('📊 请求指标: ${options.method} ${options.uri} - ${statusCode} (${duration}ms)');
    }
  }
  
  /// 处理排队的请求
  Future<void> _handleQueuedRequest(RequestOptions options) async {
    if (!_isOnline) {
      _requestQueue.add(options);
      final completer = Completer<Response>();
      _pendingRequests[options.path] = completer;
      Logger.d('请求已排队: ${options.method} ${options.path}');
      return;
    }
    
    // 并发控制
    await _acquireConcurrencySlot();
  }
  
  /// 获取并发槽位
  Future<void> _acquireConcurrencySlot() async {
    if (_currentActiveRequests >= _maxConcurrentRequests) {
      final completer = Completer<void>();
      _concurrencyQueue.add(completer);
      await completer.future;
    }
    _currentActiveRequests++;
  }
  
  /// 释放并发槽位
  void _releaseConcurrencySlot() {
    _currentActiveRequests--;
    if (_concurrencyQueue.isNotEmpty) {
      final completer = _concurrencyQueue.removeFirst();
      completer.complete();
    }
  }
  
  /// 处理排队的请求
  Future<void> _processRequestQueue() async {
    if (_isProcessingQueue || _requestQueue.isEmpty || !_isOnline) return;
    
    _isProcessingQueue = true;
    Logger.d('开始处理 ${_requestQueue.length} 个排队请求');
    
    final List<Future> processingTasks = [];
    
    while (_requestQueue.isNotEmpty && _isOnline && processingTasks.length < _maxConcurrentRequests) {
      final request = _requestQueue.removeFirst();
      final task = _processQueuedRequest(request);
      processingTasks.add(task);
    }
    
    if (processingTasks.isNotEmpty) {
      await Future.wait(processingTasks, eagerError: false);
    }
    
    _isProcessingQueue = false;
    
    // 如果还有排队的请求，继续处理
    if (_requestQueue.isNotEmpty && _isOnline) {
      await _processRequestQueue();
    }
  }
  
  /// 处理单个排队的请求
  Future<void> _processQueuedRequest(RequestOptions request) async {
    try {
      await _acquireConcurrencySlot();
      
      final response = await _dio.fetch(request);
      final completer = _pendingRequests.remove(request.path);
      completer?.complete(response);
      
      Logger.d('排队请求处理成功: ${request.method} ${request.path}');
    } catch (e) {
      final completer = _pendingRequests.remove(request.path);
      completer?.completeError(e);
      
      Logger.e('排队请求处理失败: ${request.method} ${request.path} - $e');
    } finally {
      _releaseConcurrencySlot();
    }
  }
  
  /// 处理未授权错误
  Future<void> _handleUnauthorized() async {
    await _storageService.clearToken();
    await _storageService.clearUserData();
    // 这里可以发送事件通知 UI 跳转到登录页
  }
  
  /// 统一错误映射和处理
  Future<DioException> _mapError(DioException error) async {
    String message;
    String? userFriendlyMessage;
    
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        message = '网络连接超时，请检查网络设置';
        userFriendlyMessage = '网络连接超时，请稍后重试';
        break;
      case DioExceptionType.badResponse:
        message = _getErrorMessage(error.response?.statusCode ?? 0);
        userFriendlyMessage = _getUserFriendlyErrorMessage(error.response?.statusCode ?? 0, error.response?.data);
        break;
      case DioExceptionType.cancel:
        message = '请求已取消';
        userFriendlyMessage = '操作已取消';
        break;
      case DioExceptionType.connectionError:
        message = '网络连接失败';
        userFriendlyMessage = '网络连接不可用，请检查网络设置';
        break;
      case DioExceptionType.unknown:
      default:
        message = '未知网络错误';
        userFriendlyMessage = '网络异常，请稍后重试';
        break;
    }
    
    // 记录错误到崩溃报告服务
    await _reportError(error, message);
    
    return DioException(
      requestOptions: error.requestOptions,
      type: error.type,
      message: message,
      response: error.response,
      error: {
        'originalError': error.error,
        'userFriendlyMessage': userFriendlyMessage,
        'timestamp': DateTime.now().toIso8601String(),
        'requestId': error.requestOptions.headers['X-Request-ID'],
      },
    );
  }
  
  /// 根据状态码获取错误信息
  String _getErrorMessage(int statusCode) {
    switch (statusCode) {
      case 400:
        return '请求参数错误';
      case 401:
        return '未授权访问';
      case 403:
        return '访问被禁止';
      case 404:
        return '请求的资源不存在';
      case 409:
        return '请求冲突';
      case 422:
        return '请求数据验证失败';
      case 429:
        return '请求过于频繁，请稍后重试';
      case 500:
        return '服务器内部错误';
      case 502:
        return '网关错误';
      case 503:
        return '服务暂时不可用';
      case 504:
        return '网关超时';
      default:
        return '网络请求失败 ($statusCode)';
    }
  }
  
  /// 获取用户友好的错误信息
  String _getUserFriendlyErrorMessage(int statusCode, dynamic responseData) {
    // 尝试从响应数据中提取用户友好的错误信息
    if (responseData is Map<String, dynamic>) {
      final userMessage = responseData['user_message'] ?? responseData['message'];
      if (userMessage is String && userMessage.isNotEmpty) {
        return userMessage;
      }
    }
    
    // 返回默认的用户友好信息
    switch (statusCode) {
      case 400:
        return '输入信息有误，请检查后重试';
      case 401:
        return '登录已过期，请重新登录';
      case 403:
        return '您没有权限执行此操作';
      case 404:
        return '请求的内容不存在';
      case 409:
        return '操作冲突，请刷新后重试';
      case 422:
        return '输入数据格式错误';
      case 429:
        return '操作过于频繁，请稍后重试';
      case 500:
      case 502:
      case 503:
      case 504:
        return '服务暂时不可用，请稍后重试';
      default:
        return '网络异常，请稍后重试';
    }
  }
  
  /// 判断是否应该重试请求
  bool _shouldRetry(DioException error) {
    // 不重试的情况
    if (error.type == DioExceptionType.cancel) return false;
    if (error.response?.statusCode == 401) return false; // 未授权
    if (error.response?.statusCode == 403) return false; // 禁止访问
    if (error.response?.statusCode == 404) return false; // 资源不存在
    if (error.response?.statusCode == 422) return false; // 数据验证失败
    
    // 可以重试的情况
    if (error.type == DioExceptionType.connectionTimeout) return true;
    if (error.type == DioExceptionType.sendTimeout) return true;
    if (error.type == DioExceptionType.receiveTimeout) return true;
    if (error.type == DioExceptionType.connectionError) return true;
    if (error.response?.statusCode == 429) return true; // 限流
    if (error.response?.statusCode == 500) return true; // 服务器错误
    if (error.response?.statusCode == 502) return true; // 网关错误
    if (error.response?.statusCode == 503) return true; // 服务不可用
    if (error.response?.statusCode == 504) return true; // 网关超时
    
    return false;
  }
  
  /// 报告错误到崩溃报告服务
  Future<void> _reportError(DioException error, String message) async {
    try {
      // 这里可以集成Firebase Crashlytics或Sentry
      if (kDebugMode) {
        Logger.e('🚨 网络错误报告: $message', error: error);
      }
      // TODO: 实际的错误报告逻辑
    } catch (e) {
      Logger.e('错误报告失败', error: e);
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
  
  /// 释放资源
  void dispose() {
    _connectivitySubscription?.cancel();
    _dio.close();
    _requestQueue.clear();
    _pendingRequests.clear();
    _concurrencyQueue.clear();
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