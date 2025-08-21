import 'dart:async';
import 'package:flutter/foundation.dart';

/// 性能优化工具类
class PerformanceUtils {
  /// 防抖函数
  static Timer? _debounceTimer;
  
  /// 防抖执行函数
  /// [duration] 防抖延迟时间
  /// [callback] 要执行的回调函数
  static void debounce(Duration duration, VoidCallback callback) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(duration, callback);
  }
  
  /// 节流函数
  static Timer? _throttleTimer;
  static bool _throttleCanExecute = true;
  
  /// 节流执行函数
  /// [duration] 节流间隔时间
  /// [callback] 要执行的回调函数
  static void throttle(Duration duration, VoidCallback callback) {
    if (_throttleCanExecute) {
      callback();
      _throttleCanExecute = false;
      _throttleTimer = Timer(duration, () {
        _throttleCanExecute = true;
      });
    }
  }
  
  /// 清理所有定时器
  static void dispose() {
    _debounceTimer?.cancel();
    _throttleTimer?.cancel();
    _debounceTimer = null;
    _throttleTimer = null;
    _throttleCanExecute = true;
  }
}

/// 优化的ListView构建器
class OptimizedListView extends StatelessWidget {
  final int itemCount;
  final Widget Function(BuildContext context, int index) itemBuilder;
  final ScrollController? controller;
  final EdgeInsetsGeometry? padding;
  final bool shrinkWrap;
  final ScrollPhysics? physics;
  
  const OptimizedListView({
    super.key,
    required this.itemCount,
    required this.itemBuilder,
    this.controller,
    this.padding,
    this.shrinkWrap = false,
    this.physics,
  });
  
  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      controller: controller,
      padding: padding,
      shrinkWrap: shrinkWrap,
      physics: physics,
      itemCount: itemCount,
      itemBuilder: (context, index) {
        // 使用RepaintBoundary来隔离重绘
        return RepaintBoundary(
          child: itemBuilder(context, index),
        );
      },
      // 添加缓存范围以提高滚动性能
      cacheExtent: 250.0,
    );
  }
}

/// 优化的状态管理Mixin
mixin OptimizedStateMixin<T extends StatefulWidget> on State<T> {
  bool _mounted = true;
  
  @override
  void dispose() {
    _mounted = false;
    super.dispose();
  }
  
  /// 安全的setState调用
  void safeSetState(VoidCallback fn) {
    if (_mounted && mounted) {
      setState(fn);
    }
  }
  
  /// 防抖setState
  void debouncedSetState(VoidCallback fn, {Duration duration = const Duration(milliseconds: 300)}) {
    PerformanceUtils.debounce(duration, () {
      safeSetState(fn);
    });
  }
}

/// 内存优化的图片缓存
class OptimizedImageCache {
  static final Map<String, ImageProvider> _cache = {};
  static const int _maxCacheSize = 50;
  
  /// 获取缓存的图片
  static ImageProvider? getCachedImage(String url) {
    return _cache[url];
  }
  
  /// 缓存图片
  static void cacheImage(String url, ImageProvider image) {
    if (_cache.length >= _maxCacheSize) {
      // 移除最旧的缓存项
      final firstKey = _cache.keys.first;
      _cache.remove(firstKey);
    }
    _cache[url] = image;
  }
  
  /// 清理缓存
  static void clearCache() {
    _cache.clear();
  }
}