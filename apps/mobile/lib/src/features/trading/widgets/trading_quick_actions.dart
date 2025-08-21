import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/router/app_routes.dart';
import '../../../core/constants/app_strings.dart';

/// 交易快捷操作
class TradingQuickActions extends StatelessWidget {
  const TradingQuickActions({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            AppStrings.quickActions,
            style: AppTextStyles.titleMedium.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildActionItem(
                  context,
                  icon: Icons.add_circle_outline,
                  title: AppStrings.buy,
                  subtitle: AppStrings.stockBuy,
                  color: AppColors.error,
                  onTap: () => _navigateToTrade(context, 'buy'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildActionItem(
                  context,
                  icon: Icons.remove_circle_outline,
                  title: AppStrings.sell,
                  subtitle: AppStrings.stockSell,
                  color: AppColors.success,
                  onTap: () => _navigateToTrade(context, 'sell'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildActionItem(
                  context,
                  icon: Icons.account_balance_wallet_outlined,
                  title: AppStrings.funds,
                  subtitle: AppStrings.bankSecuritiesTransfer,
                  color: AppColors.primary,
                  onTap: () => _navigateToFund(context),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildActionItem(
                  context,
                  icon: Icons.assignment_outlined,
                  title: AppStrings.orders,
                  subtitle: AppStrings.orderQuery,
                  color: AppColors.warning,
                  onTap: () => _navigateToOrders(context),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// 构建操作项目
  Widget _buildActionItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Icon(
                icon,
                color: color,
                size: 24,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: AppTextStyles.titleSmall.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  /// 导航到交易页面
  void _navigateToTrade(BuildContext context, String type) {
    // 这里应该导航到具体的买入/卖出页面
    // 暂时使用占位符路由
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${type == 'buy' ? AppStrings.buy : AppStrings.sell}${AppStrings.functionInDevelopment}'),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  /// 导航到资金页面
  void _navigateToFund(BuildContext context) {
    // 这里应该导航到资金管理页面
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('${AppStrings.fundManagement}${AppStrings.functionInDevelopment}'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  /// 导航到委托页面
  void _navigateToOrders(BuildContext context) {
    // 这里应该导航到委托查询页面
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('${AppStrings.orderQuery}${AppStrings.functionInDevelopment}'),
        duration: Duration(seconds: 2),
      ),
    );
  }
}