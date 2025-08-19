import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/router/app_routes.dart';
import '../../stock/models/stock_model.dart';
import '../../stock/providers/stock_provider.dart';

/// 新闻资讯区域
class NewsSection extends ConsumerWidget {
  const NewsSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stockNews = ref.watch(stockNewsProvider(''));

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 标题栏
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 4,
                      height: 20,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '财经新闻',
                      style: AppTextStyles.titleMedium.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                GestureDetector(
                  onTap: () {
                    context.push(AppRoutes.news);
                  },
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '更多',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Icon(
                        Icons.arrow_forward_ios,
                        color: AppColors.textSecondary,
                        size: 12,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // 新闻列表
          stockNews.when(
            data: (news) => _buildNewsList(context, news),
            loading: () => _buildLoading(),
            error: (error, stack) => _buildError(context, error),
          ),
        ],
      ),
    );
  }

  /// 构建新闻列表
  Widget _buildNewsList(BuildContext context, List<StockNews> news) {
    if (news.isEmpty) {
      return _buildEmpty();
    }

    // 只显示前4条新闻
    final displayNews = news.take(4).toList();
    
    return Column(
      children: [
        // 第一条新闻（大图显示）
        if (displayNews.isNotEmpty) _buildFeaturedNews(context, displayNews[0]),
        
        // 其他新闻（列表显示）
        ...displayNews.skip(1).map((newsItem) => _buildNewsItem(context, newsItem)),
        
        const SizedBox(height: 16),
      ],
    );
  }

  /// 构建特色新闻（第一条）
  Widget _buildFeaturedNews(BuildContext context, StockNews news) {
    return GestureDetector(
      onTap: () {
        context.push('${AppRoutes.newsDetail}/${news.id}');
      },
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: AppColors.outline.withOpacity(0.3),
            width: 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 新闻图片
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
              child: AspectRatio(
                aspectRatio: 16 / 9,
                child: news.imageUrl != null && news.imageUrl!.isNotEmpty
                    ? Image.network(
                        news.imageUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return _buildPlaceholderImage();
                        },
                      )
                    : _buildPlaceholderImage(),
              ),
            ),
            
            // 新闻内容
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    news.title,
                    style: AppTextStyles.titleSmall.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    news.summary ?? '',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.textSecondary,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Text(
                        news.source,
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        width: 4,
                        height: 4,
                        decoration: BoxDecoration(
                          color: AppColors.textSecondary,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _formatTime(news.publishTime),
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// 构建新闻项
  Widget _buildNewsItem(BuildContext context, StockNews news) {
    return GestureDetector(
      onTap: () {
        context.push('${AppRoutes.newsDetail}/${news.id}');
      },
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 新闻内容
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    news.title,
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Text(
                        news.source,
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        width: 4,
                        height: 4,
                        decoration: BoxDecoration(
                          color: AppColors.textSecondary,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _formatTime(news.publishTime),
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            
            const SizedBox(width: 12),
            
            // 新闻缩略图
            if (news.imageUrl != null && news.imageUrl!.isNotEmpty)
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: SizedBox(
                  width: 80,
                  height: 60,
                  child: Image.network(
                    news.imageUrl!,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        color: AppColors.surface,
                        child: Icon(
                          Icons.image_outlined,
                          color: AppColors.textSecondary,
                          size: 24,
                        ),
                      );
                    },
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  /// 构建占位图片
  Widget _buildPlaceholderImage() {
    return Container(
      color: AppColors.surface,
      child: Center(
        child: Icon(
          Icons.article_outlined,
          color: AppColors.textSecondary,
          size: 48,
        ),
      ),
    );
  }

  /// 格式化时间
  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);
    
    if (difference.inMinutes < 60) {
      return '${difference.inMinutes}分钟前';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}小时前';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}天前';
    } else {
      return '${time.month}月${time.day}日';
    }
  }

  /// 构建加载状态
  Widget _buildLoading() {
    return Column(
      children: [
        // 特色新闻加载状态
        Container(
          margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: AppColors.outline.withOpacity(0.3),
              width: 1,
            ),
          ),
          child: Column(
            children: [
              Container(
                height: 120,
                decoration: BoxDecoration(
                  color: AppColors.outline.withOpacity(0.3),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: double.infinity,
                      height: 16,
                      decoration: BoxDecoration(
                        color: AppColors.outline.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: 200,
                      height: 12,
                      decoration: BoxDecoration(
                        color: AppColors.outline.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        
        // 其他新闻加载状态
        ...List.generate(3, (index) {
          return Container(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: double.infinity,
                        height: 16,
                        decoration: BoxDecoration(
                          color: AppColors.outline.withOpacity(0.3),
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        width: 120,
                        height: 12,
                        decoration: BoxDecoration(
                          color: AppColors.outline.withOpacity(0.3),
                          borderRadius: BorderRadius.circular(6),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  width: 80,
                  height: 60,
                  decoration: BoxDecoration(
                    color: AppColors.outline.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
              ],
            ),
          );
        }),
        
        const SizedBox(height: 16),
      ],
    );
  }

  /// 构建错误状态
  Widget _buildError(BuildContext context, Object error) {
    return Container(
      height: 120,
      padding: const EdgeInsets.all(16),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              color: AppColors.textSecondary,
              size: 32,
            ),
            const SizedBox(height: 8),
            Text(
              '加载失败',
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// 构建空状态
  Widget _buildEmpty() {
    return Container(
      height: 120,
      padding: const EdgeInsets.all(16),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.article_outlined,
              color: AppColors.textSecondary,
              size: 32,
            ),
            const SizedBox(height: 8),
            Text(
              '暂无新闻',
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}