import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

/// 免责声明类型
enum DisclaimerType {
  investment,
  ai,
  data,
  general,
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

/// 免责声明配置
class DisclaimerConfig {
  final Map<String, String> title;
  final Map<String, String> content;
  final String iconName;
  final bool showIcon;
  final bool closable;
  final ComponentPosition position;
  final ComponentTheme theme;
  final bool enabled;

  DisclaimerConfig({
    required this.title,
    required this.content,
    required this.iconName,
    required this.showIcon,
    required this.closable,
    required this.position,
    required this.theme,
    required this.enabled,
  });

  factory DisclaimerConfig.fromJson(Map<String, dynamic> json) {
    return DisclaimerConfig(
      title: Map<String, String>.from(json['title'] ?? {}),
      content: Map<String, String>.from(json['content'] ?? {}),
      iconName: json['iconName'] ?? 'warning',
      showIcon: json['showIcon'] ?? true,
      closable: json['closable'] ?? true,
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

/// 合规免责声明组件
class ComplianceDisclaimer extends StatefulWidget {
  final DisclaimerType type;
  final SupportedLanguage? language;
  final bool? showIcon;
  final bool? closable;
  final ComponentPosition? position;
  final ComponentTheme? theme;
  final VoidCallback? onClose;
  final EdgeInsetsGeometry? margin;
  final EdgeInsetsGeometry? padding;

  const ComplianceDisclaimer({
    Key? key,
    required this.type,
    this.language,
    this.showIcon,
    this.closable,
    this.position,
    this.theme,
    this.onClose,
    this.margin,
    this.padding,
  }) : super(key: key);

  @override
  State<ComplianceDisclaimer> createState() => _ComplianceDisclaimerState();
}

class _ComplianceDisclaimerState extends State<ComplianceDisclaimer> {
  DisclaimerConfig? _config;
  bool _isEnabled = false;
  bool _isLoading = true;
  bool _isVisible = true;
  SupportedLanguage _currentLanguage = SupportedLanguage.zh;

  @override
  void initState() {
    super.initState();
    _currentLanguage = widget.language ?? _getSystemLanguage();
    _loadConfig();
  }

  @override
  void didUpdateWidget(ComplianceDisclaimer oldWidget) {
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
      final globalEnabled = await _isComplianceEnabled('disclaimer');
      if (!globalEnabled) {
        setState(() {
          _isEnabled = false;
          _isLoading = false;
        });
        return;
      }

      // 获取配置
      final config = await _getDisclaimerConfig(widget.type, _currentLanguage);
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
      debugPrint('Failed to load disclaimer config: $error');
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

  Future<DisclaimerConfig?> _getDisclaimerConfig(
    DisclaimerType type,
    SupportedLanguage language,
  ) async {
    try {
      // 这里应该调用实际的API
      // 暂时返回默认配置
      return _getDefaultConfig(type);
    } catch (error) {
      debugPrint('Failed to get disclaimer config: $error');
      return null;
    }
  }

  DisclaimerConfig _getDefaultConfig(DisclaimerType type) {
    switch (type) {
      case DisclaimerType.investment:
        return DisclaimerConfig(
          title: {
            'zh': '投资风险提示',
            'en': 'Investment Risk Warning',
          },
          content: {
            'zh': '投资有风险，入市需谨慎。本平台提供的信息仅供参考，不构成投资建议。',
            'en': 'Investment involves risks. Please invest cautiously. Information provided is for reference only and does not constitute investment advice.',
          },
          iconName: 'warning',
          showIcon: true,
          closable: true,
          position: ComponentPosition.bottom,
          theme: ComponentTheme.light,
          enabled: true,
        );
      case DisclaimerType.ai:
        return DisclaimerConfig(
          title: {
            'zh': 'AI分析说明',
            'en': 'AI Analysis Disclaimer',
          },
          content: {
            'zh': 'AI分析结果仅供参考，不保证准确性。请结合其他信息做出决策。',
            'en': 'AI analysis results are for reference only. Accuracy is not guaranteed. Please make decisions based on comprehensive information.',
          },
          iconName: 'info',
          showIcon: true,
          closable: true,
          position: ComponentPosition.bottom,
          theme: ComponentTheme.light,
          enabled: true,
        );
      case DisclaimerType.data:
        return DisclaimerConfig(
          title: {
            'zh': '数据声明',
            'en': 'Data Disclaimer',
          },
          content: {
            'zh': '数据可能存在延迟，请以官方数据为准。',
            'en': 'Data may be delayed. Please refer to official sources for accuracy.',
          },
          iconName: 'info',
          showIcon: true,
          closable: true,
          position: ComponentPosition.bottom,
          theme: ComponentTheme.light,
          enabled: true,
        );
      case DisclaimerType.general:
      default:
        return DisclaimerConfig(
          title: {
            'zh': '免责声明',
            'en': 'Disclaimer',
          },
          content: {
            'zh': '本平台提供的信息仅供参考，请谨慎使用。',
            'en': 'Information provided is for reference only. Please use with caution.',
          },
          iconName: 'info',
          showIcon: true,
          closable: true,
          position: ComponentPosition.bottom,
          theme: ComponentTheme.light,
          enabled: true,
        );
    }
  }

  IconData _getIcon() {
    if (_config?.showIcon == false && widget.showIcon != true) {
      return Icons.info_outline;
    }

    switch (_config?.iconName ?? widget.type.name) {
      case 'warning':
      case 'investment':
        return Icons.warning_amber_outlined;
      case 'info':
      case 'ai':
      case 'data':
        return Icons.info_outline;
      default:
        return Icons.info_outline;
    }
  }

  Color _getBackgroundColor(BuildContext context) {
    final currentTheme = widget.theme ?? _config?.theme ?? ComponentTheme.light;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    switch (currentTheme) {
      case ComponentTheme.dark:
        return const Color(0xFF1f1f1f);
      case ComponentTheme.light:
      default:
        if (isDark) {
          return const Color(0xFF2d2d2d);
        }
        switch (widget.type) {
          case DisclaimerType.investment:
            return Colors.orange.shade50;
          case DisclaimerType.ai:
            return Colors.blue.shade50;
          case DisclaimerType.data:
            return Colors.green.shade50;
          default:
            return Colors.grey.shade50;
        }
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
        switch (widget.type) {
          case DisclaimerType.investment:
            return Colors.orange.shade200;
          case DisclaimerType.ai:
            return Colors.blue.shade200;
          case DisclaimerType.data:
            return Colors.green.shade200;
          default:
            return Colors.grey.shade200;
        }
    }
  }

  Color _getIconColor(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    if (isDark) {
      return Colors.white70;
    }
    
    switch (widget.type) {
      case DisclaimerType.investment:
        return Colors.orange.shade600;
      case DisclaimerType.ai:
        return Colors.blue.shade600;
      case DisclaimerType.data:
        return Colors.green.shade600;
      default:
        return Colors.grey.shade600;
    }
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
    if (_isLoading || !_isEnabled || _config == null || !_isVisible) {
      return const SizedBox.shrink();
    }

    final title = _getText(_config!.title);
    final content = _getText(_config!.content);
    final isClosable = widget.closable ?? _config!.closable;
    final showIcon = widget.showIcon ?? _config!.showIcon;

    final alertWidget = Container(
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
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (showIcon) ..[
            Icon(
              _getIcon(),
              color: _getIconColor(context),
              size: 20,
            ),
            const SizedBox(width: 8),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (title.isNotEmpty)
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: _getIconColor(context),
                    ),
                  ),
                if (title.isNotEmpty && content.isNotEmpty)
                  const SizedBox(height: 4),
                if (content.isNotEmpty)
                  Text(
                    content,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).brightness == Brightness.dark
                          ? Colors.white70
                          : Colors.grey.shade700,
                    ),
                  ),
              ],
            ),
          ),
          if (isClosable) ..[
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () {
                setState(() {
                  _isVisible = false;
                });
                widget.onClose?.call();
              },
              child: Icon(
                Icons.close,
                size: 16,
                color: Theme.of(context).brightness == Brightness.dark
                    ? Colors.white54
                    : Colors.grey.shade500,
              ),
            ),
          ],
        ],
      ),
    );

    final position = widget.position ?? _config!.position;
    if (position == ComponentPosition.bottom || position == ComponentPosition.top) {
      return _buildPositionedWidget(alertWidget);
    }

    return alertWidget;
  }
}

// 快捷组件
class InvestmentDisclaimer extends StatelessWidget {
  final SupportedLanguage? language;
  final bool? showIcon;
  final bool? closable;
  final ComponentPosition? position;
  final ComponentTheme? theme;
  final VoidCallback? onClose;
  final EdgeInsetsGeometry? margin;
  final EdgeInsetsGeometry? padding;

  const InvestmentDisclaimer({
    Key? key,
    this.language,
    this.showIcon,
    this.closable,
    this.position,
    this.theme,
    this.onClose,
    this.margin,
    this.padding,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ComplianceDisclaimer(
      type: DisclaimerType.investment,
      language: language,
      showIcon: showIcon,
      closable: closable,
      position: position,
      theme: theme,
      onClose: onClose,
      margin: margin,
      padding: padding,
    );
  }
}

class AIDisclaimer extends StatelessWidget {
  final SupportedLanguage? language;
  final bool? showIcon;
  final bool? closable;
  final ComponentPosition? position;
  final ComponentTheme? theme;
  final VoidCallback? onClose;
  final EdgeInsetsGeometry? margin;
  final EdgeInsetsGeometry? padding;

  const AIDisclaimer({
    Key? key,
    this.language,
    this.showIcon,
    this.closable,
    this.position,
    this.theme,
    this.onClose,
    this.margin,
    this.padding,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ComplianceDisclaimer(
      type: DisclaimerType.ai,
      language: language,
      showIcon: showIcon,
      closable: closable,
      position: position,
      theme: theme,
      onClose: onClose,
      margin: margin,
      padding: padding,
    );
  }
}

class DataDisclaimer extends StatelessWidget {
  final SupportedLanguage? language;
  final bool? showIcon;
  final bool? closable;
  final ComponentPosition? position;
  final ComponentTheme? theme;
  final VoidCallback? onClose;
  final EdgeInsetsGeometry? margin;
  final EdgeInsetsGeometry? padding;

  const DataDisclaimer({
    Key? key,
    this.language,
    this.showIcon,
    this.closable,
    this.position,
    this.theme,
    this.onClose,
    this.margin,
    this.padding,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ComplianceDisclaimer(
      type: DisclaimerType.data,
      language: language,
      showIcon: showIcon,
      closable: closable,
      position: position,
      theme: theme,
      onClose: onClose,
      margin: margin,
      padding: padding,
    );
  }
}