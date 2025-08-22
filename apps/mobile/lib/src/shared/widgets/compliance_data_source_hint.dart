import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;

/// 数据源类型
enum DataSourceType {
  realtime,
  delayed,
  historical,
  estimated,
}

/// 组件位置
enum ComponentPosition {
  top,
  bottom,
  inline,
}

/// 组件主题
enum ComponentTheme {
  light,
  dark,
}

/// 支持的语言
enum SupportedLanguage {
  zh,
  en,
}

/// 数据提供商信息
class DataProvider {
  final Map<String, String> name;
  final String? website;
  final int? delay;

  DataProvider({
    required this.name,
    this.website,
    this.delay,
  });

  factory DataProvider.fromJson(Map<String, dynamic> json) {
    return DataProvider(
      name: Map<String, String>.from(json['name'] ?? {}),
      website: json['website'],
      delay: json['delay'],
    );
  }
}

/// 数据源配置
class DataSourceConfig {
  final Map<String, String> hint;
  final Map<String, String> description;
  final DataProvider provider;
  final bool showDelay;
  final ComponentPosition position;
  final ComponentTheme theme;
  final bool enabled;

  DataSourceConfig({
    required this.hint,
    required this.description,
    required this.provider,
    required this.showDelay,
    required this.position,
    required this.theme,
    required this.enabled,
  });

  factory DataSourceConfig.fromJson(Map<String, dynamic> json) {
    return DataSourceConfig(
      hint: Map<String, String>.from(json['hint'] ?? {}),
      description: Map<String, String>.from(json['description'] ?? {}),
      provider: DataProvider.fromJson(json['provider'] ?? {}),
      showDelay: json['showDelay'] ?? true,
      position: ComponentPosition.values.firstWhere(
        (e) => e.name == json['position'],
        orElse: () => ComponentPosition.bottom,
      ),
      theme: ComponentTheme.values.firstWhere(
        (e) => e.name == json['theme'],
        orElse: () => ComponentTheme.light,
      ),
      enabled: json['enabled'] ?? true,
    );
  }
}

/// 数据源提示组件
class ComplianceDataSourceHint extends StatefulWidget {
  final DataSourceType type;
  final SupportedLanguage? language;
  final bool? showDelay;
  final ComponentPosition? position;
  final ComponentTheme? theme;
  final EdgeInsetsGeometry? margin;
  final EdgeInsetsGeometry? padding;

  const ComplianceDataSourceHint({
    Key? key,
    required this.type,
    this.language,
    this.showDelay,
    this.position,
    this.theme,
    this.margin,
    this.padding,
  }) : super(key: key);

  @override
  State<ComplianceDataSourceHint> createState() => _ComplianceDataSourceHintState();
}

class _ComplianceDataSourceHintState extends State<ComplianceDataSourceHint> {
  DataSourceConfig? _config;
  bool _isEnabled = false;
  bool _isLoading = true;
  SupportedLanguage _currentLanguage = SupportedLanguage.zh;

  @override
  void initState() {
    super.initState();
    _currentLanguage = widget.language ?? _getSystemLanguage();
    _loadConfig();
  }

  @override
  void didUpdateWidget(ComplianceDataSourceHint oldWidget) {
    super.didUpdateWidget(oldWidget);
    final newLanguage = widget.language ?? _getSystemLanguage();
    if (oldWidget.type != widget.type || _currentLanguage != newLanguage) {
      _currentLanguage = newLanguage;
      _loadConfig();
    }
  }

  /// 获取系统语言
  SupportedLanguage _getSystemLanguage() {
    try {
      if (kIsWeb) {
        // Web平台使用浏览器语言
        return SupportedLanguage.zh; // 默认中文
      } else {
        // 移动平台使用系统语言
        final locale = WidgetsBinding.instance.platformDispatcher.locale;
        if (locale.languageCode == 'en') {
          return SupportedLanguage.en;
        }
        return SupportedLanguage.zh;
      }
    } catch (e) {
      return SupportedLanguage.zh;
    }
  }

  /// 根据当前语言获取文本
  String _getText(Map<String, String> textMap) {
    return textMap[_currentLanguage.name] ?? textMap['zh'] ?? '';
  }

  Future<void> _loadConfig() async {
    try {
      setState(() {
        _isLoading = true;
      });

      // 检查全局开关
      final globalEnabled = await _isComplianceEnabled('dataSourceHint');
      if (!globalEnabled) {
        setState(() {
          _isEnabled = false;
          _isLoading = false;
        });
        return;
      }

      // 获取配置
      final config = await _getDataSourceConfig(widget.type, _currentLanguage);
      if (config != null) {
        setState(() {
          _config = config;
          _isEnabled = true;
        });
      } else {
        setState(() {
          _isEnabled = false;
        });
      }
    } catch (error) {
      debugPrint('Failed to load data source config: $error');
      setState(() {
        _isEnabled = false;
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<bool> _isComplianceEnabled(String componentType) async {
    try {
      final apiUrl = const String.fromEnvironment('API_URL', defaultValue: 'http://localhost:3003');
      final response = await http.get(
        Uri.parse('$apiUrl/api/compliance/config'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          final globalConfig = data['data']['globalConfig'];
          return componentType == 'disclaimer' 
              ? globalConfig['disclaimerEnabled'] ?? true
              : globalConfig['dataSourceHintEnabled'] ?? true;
        }
      }
      
      // 如果API调用失败，返回默认值true
      return true;
    } catch (error) {
      debugPrint('Failed to check compliance status: $error');
      // 出错时默认启用组件
      return true;
    }
  }

  Future<DataSourceConfig?> _getDataSourceConfig(
    DataSourceType type,
    SupportedLanguage language,
  ) async {
    try {
      // 这里应该调用实际的API
      // 暂时返回默认配置
      return _getDefaultConfig(type);
    } catch (error) {
      debugPrint('Failed to get data source config: $error');
      return null;
    }
  }

  DataSourceConfig _getDefaultConfig(DataSourceType type) {
    switch (type) {
      case DataSourceType.realtime:
        return DataSourceConfig(
          hint: {
            'zh': '实时数据',
            'en': 'Real-time Data',
          },
          description: {
            'zh': '数据实时更新，可能存在网络延迟',
            'en': 'Data updates in real-time, network delays may occur',
          },
          provider: DataProvider(
            name: {
              'zh': '实时数据提供商',
              'en': 'Real-time Data Provider',
            },
            website: 'https://example.com',
            delay: 0,
          ),
          showDelay: false,
          position: ComponentPosition.bottom,
          theme: ComponentTheme.light,
          enabled: true,
        );
      case DataSourceType.delayed:
        return DataSourceConfig(
          hint: {
            'zh': '延迟数据',
            'en': 'Delayed Data',
          },
          description: {
            'zh': '数据存在延迟，请以官方数据为准',
            'en': 'Data is delayed, please refer to official sources',
          },
          provider: DataProvider(
            name: {
              'zh': '延迟数据提供商',
              'en': 'Delayed Data Provider',
            },
            website: 'https://example.com',
            delay: 15,
          ),
          showDelay: true,
          position: ComponentPosition.bottom,
          theme: ComponentTheme.light,
          enabled: true,
        );
      case DataSourceType.historical:
        return DataSourceConfig(
          hint: {
            'zh': '历史数据',
            'en': 'Historical Data',
          },
          description: {
            'zh': '显示历史数据，仅供参考',
            'en': 'Historical data for reference only',
          },
          provider: DataProvider(
            name: {
              'zh': '历史数据提供商',
              'en': 'Historical Data Provider',
            },
            website: 'https://example.com',
          ),
          showDelay: false,
          position: ComponentPosition.bottom,
          theme: ComponentTheme.light,
          enabled: true,
        );
      case DataSourceType.estimated:
        return DataSourceConfig(
          hint: {
            'zh': '预估数据',
            'en': 'Estimated Data',
          },
          description: {
            'zh': '基于算法预估的数据，仅供参考',
            'en': 'Algorithm-based estimated data for reference only',
          },
          provider: DataProvider(
            name: {
              'zh': '预估数据提供商',
              'en': 'Estimated Data Provider',
            },
            website: 'https://example.com',
          ),
          showDelay: false,
          position: ComponentPosition.bottom,
          theme: ComponentTheme.light,
          enabled: true,
        );
    }
  }

  Color _getBackgroundColor(BuildContext context) {
    final currentTheme = widget.theme ?? _config?.theme ?? ComponentTheme.light;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    switch (currentTheme) {
      case ComponentTheme.dark:
        return const Color(0xFF262626);
      case ComponentTheme.light:
      default:
        if (isDark) {
          return const Color(0xFF2d2d2d);
        }
        return Colors.blue.shade50;
    }
  }

  Color _getBorderColor(BuildContext context) {
    final currentTheme = widget.theme ?? _config?.theme ?? ComponentTheme.light;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    switch (currentTheme) {
      case ComponentTheme.dark:
        return const Color(0xFF434343);
      case ComponentTheme.light:
      default:
        if (isDark) {
          return const Color(0xFF434343);
        }
        return Colors.blue.shade200;
    }
  }

  Color _getTypeTagColor() {
    switch (widget.type) {
      case DataSourceType.realtime:
        return Colors.green;
      case DataSourceType.delayed:
        return Colors.orange;
      case DataSourceType.historical:
        return Colors.blue;
      case DataSourceType.estimated:
        return Colors.purple;
    }
  }

  String _getTypeTagText() {
    final isZh = _currentLanguage == SupportedLanguage.zh;
    switch (widget.type) {
      case DataSourceType.realtime:
        return isZh ? '实时' : 'Real-time';
      case DataSourceType.delayed:
        return isZh ? '延迟' : 'Delayed';
      case DataSourceType.historical:
        return isZh ? '历史' : 'Historical';
      case DataSourceType.estimated:
        return isZh ? '预估' : 'Estimated';
    }
  }

  Widget _buildDelayChip() {
    if (_config?.provider.delay == null || 
        (!(_config?.showDelay ?? false) && widget.showDelay != true)) {
      return const SizedBox.shrink();
    }

    final isZh = _currentLanguage == SupportedLanguage.zh;
    final delayText = isZh 
        ? '延迟${_config!.provider.delay}分钟'
        : '${_config!.provider.delay}min delay';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: Colors.orange.shade100,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.orange.shade300),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.access_time,
            size: 12,
            color: Colors.orange.shade700,
          ),
          const SizedBox(width: 2),
          Text(
            delayText,
            style: TextStyle(
              fontSize: 10,
              color: Colors.orange.shade700,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypeChip() {
    final color = _getTypeTagColor();
    final text = _getTypeTagText();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.shade100,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.shade300),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 10,
          color: color.shade700,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Widget _buildProviderLink() {
    final providerName = _getText(_config!.provider.name);

    if (_config!.provider.website == null) {
      return Text(
        providerName,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          color: Colors.blue.shade600,
          fontWeight: FontWeight.w500,
        ),
      );
    }

    return GestureDetector(
      onTap: () async {
        final url = _config!.provider.website!;
        if (await canLaunchUrl(Uri.parse(url))) {
          await launchUrl(Uri.parse(url));
        }
      },
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.link,
            size: 12,
            color: Colors.blue.shade600,
          ),
          const SizedBox(width: 2),
          Text(
            providerName,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.blue.shade600,
              fontWeight: FontWeight.w500,
              decoration: TextDecoration.underline,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPositionedWidget(Widget child) {
    final position = widget.position ?? _config?.position ?? ComponentPosition.bottom;
    
    switch (position) {
      case ComponentPosition.bottom:
        return Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: child,
        );
      case ComponentPosition.top:
        return Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: child,
        );
      case ComponentPosition.inline:
      default:
        return child;
    }
  }

  @override
  Widget build(BuildContext context) {
    // 如果正在加载或未启用，不显示组件
    if (_isLoading || !_isEnabled || _config == null) {
      return const SizedBox.shrink();
    }

    final hint = _getText(_config!.hint);
    final description = _getText(_config!.description);
    final isZh = _currentLanguage == SupportedLanguage.zh;

    final hintWidget = Container(
      margin: widget.margin ?? EdgeInsets.zero,
      padding: widget.padding ?? const EdgeInsets.all(12.0),
      decoration: BoxDecoration(
        color: _getBackgroundColor(context),
        border: Border.all(
          color: _getBorderColor(context),
          width: 1,
        ),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (hint.isNotEmpty)
            Text(
              hint,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: Colors.blue.shade700,
              ),
            ),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(
                isZh ? '数据来源：' : 'Data provided by: ',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? Colors.white70
                      : Colors.grey.shade600,
                ),
              ),
              _buildProviderLink(),
              const SizedBox(width: 8),
              _buildTypeChip(),
              const SizedBox(width: 4),
              _buildDelayChip(),
            ],
          ),
          if (description.isNotEmpty) ..[
            const SizedBox(height: 4),
            Text(
              description,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontSize: 11,
                color: Theme.of(context).brightness == Brightness.dark
                    ? Colors.white60
                    : Colors.grey.shade500,
              ),
            ),
          ],
        ],
      ),
    );

    final position = widget.position ?? _config!.position;
    if (position == ComponentPosition.bottom || position == ComponentPosition.top) {
      return _buildPositionedWidget(hintWidget);
    }

    return hintWidget;
  }
}

// 快捷组件
class RealtimeDataSourceHint extends StatelessWidget {
  final SupportedLanguage? language;
  final bool? showDelay;
  final ComponentPosition? position;
  final ComponentTheme? theme;
  final EdgeInsetsGeometry? margin;
  final EdgeInsetsGeometry? padding;

  const RealtimeDataSourceHint({
    Key? key,
    this.language,
    this.showDelay,
    this.position,
    this.theme,
    this.margin,
    this.padding,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ComplianceDataSourceHint(
      type: DataSourceType.realtime,
      language: language,
      showDelay: showDelay,
      position: position,
      theme: theme,
      margin: margin,
      padding: padding,
    );
  }
}

class DelayedDataSourceHint extends StatelessWidget {
  final SupportedLanguage? language;
  final bool? showDelay;
  final ComponentPosition? position;
  final ComponentTheme? theme;
  final EdgeInsetsGeometry? margin;
  final EdgeInsetsGeometry? padding;

  const DelayedDataSourceHint({
    Key? key,
    this.language,
    this.showDelay,
    this.position,
    this.theme,
    this.margin,
    this.padding,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ComplianceDataSourceHint(
      type: DataSourceType.delayed,
      language: language,
      showDelay: showDelay,
      position: position,
      theme: theme,
      margin: margin,
      padding: padding,
    );
  }
}

class HistoricalDataSourceHint extends StatelessWidget {
  final SupportedLanguage? language;
  final bool? showDelay;
  final ComponentPosition? position;
  final ComponentTheme? theme;
  final EdgeInsetsGeometry? margin;
  final EdgeInsetsGeometry? padding;

  const HistoricalDataSourceHint({
    Key? key,
    this.language,
    this.showDelay,
    this.position,
    this.theme,
    this.margin,
    this.padding,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ComplianceDataSourceHint(
      type: DataSourceType.historical,
      language: language,
      showDelay: showDelay,
      position: position,
      theme: theme,
      margin: margin,
      padding: padding,
    );
  }
}

class EstimatedDataSourceHint extends StatelessWidget {
  final SupportedLanguage? language;
  final bool? showDelay;
  final ComponentPosition? position;
  final ComponentTheme? theme;
  final EdgeInsetsGeometry? margin;
  final EdgeInsetsGeometry? padding;

  const EstimatedDataSourceHint({
    Key? key,
    this.language,
    this.showDelay,
    this.position,
    this.theme,
    this.margin,
    this.padding,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ComplianceDataSourceHint(
      type: DataSourceType.estimated,
      language: language,
      showDelay: showDelay,
      position: position,
      theme: theme,
      margin: margin,
      padding: padding,
    );
  }
}