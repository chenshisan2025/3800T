import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'src/app.dart';
import 'src/core/services/crash_report_service.dart';
// import 'src/core/utils/logger.dart';

void main() async {
  // 确保Flutter绑定初始化
  WidgetsFlutterBinding.ensureInitialized();
  
  try {
    // 初始化日志服务
    // Logger.info('Main', 'Starting Gulingtong App');
    
    // 初始化崩溃报告服务
    await CrashReportService().initialize();
    
    // 运行应用
    runApp(
      const ProviderScope(
        child: GulingtongApp(),
      ),
    );
  } catch (error, stackTrace) {
    // 捕获启动时的错误
    // Logger.error('Main', 'Failed to start app', error, stackTrace);
    CrashReportService().reportError(error, stackTrace, context: 'App Startup');
    
    // 显示错误页面
    runApp(
      MaterialApp(
        home: Scaffold(
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.error_outline,
                  size: 64,
                  color: Colors.red,
                ),
                const SizedBox(height: 16),
                const Text(
                  '应用启动失败',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  '错误信息: $error',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.grey),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}