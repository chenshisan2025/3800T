import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createRequestLogger } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// 通知类型定义
interface Notification {
  id: string;
  user_id: string;
  rule_id: string;
  symbol: string;
  rule_type: 'price_above' | 'price_below' | 'price_change';
  trigger_price: number;
  current_price: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  notification_date: string;
  metadata?: any;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

// 查询参数类型
interface NotificationQuery {
  page?: number;
  limit?: number;
  read?: boolean;
  symbol?: string;
  rule_type?: string;
  priority?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * GET /api/me/notifications
 * 获取当前用户的通知列表
 */
export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);

  try {
    // 验证用户身份
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权访问', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    // 解析查询参数
    const query: NotificationQuery = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100), // 最大100条
      read: searchParams.get('read')
        ? searchParams.get('read') === 'true'
        : undefined,
      symbol: searchParams.get('symbol') || undefined,
      rule_type: searchParams.get('rule_type') || undefined,
      priority: searchParams.get('priority') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
    };

    // 构建查询
    let supabaseQuery = supabase
      .from('notifications')
      .select(
        `
        id,
        user_id,
        rule_id,
        symbol,
        rule_type,
        trigger_price,
        current_price,
        type,
        title,
        message,
        read,
        notification_date,
        metadata,
        priority,
        created_at,
        updated_at
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 应用过滤条件
    if (query.read !== undefined) {
      supabaseQuery = supabaseQuery.eq('read', query.read);
    }

    if (query.symbol) {
      supabaseQuery = supabaseQuery.eq('symbol', query.symbol.toUpperCase());
    }

    if (query.rule_type) {
      supabaseQuery = supabaseQuery.eq('rule_type', query.rule_type);
    }

    if (query.priority) {
      supabaseQuery = supabaseQuery.eq('priority', query.priority);
    }

    if (query.start_date) {
      supabaseQuery = supabaseQuery.gte('notification_date', query.start_date);
    }

    if (query.end_date) {
      supabaseQuery = supabaseQuery.lte('notification_date', query.end_date);
    }

    // 分页
    const offset = ((query.page || 1) - 1) * (query.limit || 20);
    supabaseQuery = supabaseQuery.range(
      offset,
      offset + (query.limit || 20) - 1
    );

    // 执行查询
    const { data: notifications, error, count } = await supabaseQuery;

    if (error) {
      logger.error('获取通知失败', { error: new Error(error.message) });
      return NextResponse.json(
        { error: '获取通知失败', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // 获取总数（用于分页）
    const { count: totalCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      logger.error('获取通知总数失败', {
        error: new Error(countError.message),
      });
    }

    // 获取未读通知数量
    const { count: unreadCount, error: unreadError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (unreadError) {
      logger.error('获取未读通知数量失败', {
        error: new Error(unreadError.message),
      });
    }

    // 统计信息
    const stats = {
      total: totalCount || 0,
      unread: unreadCount || 0,
      read: (totalCount || 0) - (unreadCount || 0),
    };

    // 分页信息
    const pagination = {
      page: query.page || 1,
      limit: query.limit || 20,
      total: totalCount || 0,
      pages: Math.ceil((totalCount || 0) / (query.limit || 20)),
      has_next: offset + (query.limit || 20) < (totalCount || 0),
      has_prev: (query.page || 1) > 1,
    };

    logger.info('获取用户通知列表成功', {
      userId,
      count: notifications?.length || 0,
      query,
      stats,
    });

    return NextResponse.json({
      success: true,
      data: notifications || [],
      stats,
      pagination,
      filters: {
        available_symbols: await getAvailableSymbols(userId),
        available_rule_types: ['price_above', 'price_below', 'price_change'],
        available_priorities: ['low', 'medium', 'high'],
      },
    });
  } catch (error) {
    logger.error('获取通知列表失败', { error: error as Error });
    return NextResponse.json(
      { error: '服务器内部错误', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/me/notifications
 * 批量更新通知状态（如标记为已读）
 */
export async function PATCH(request: NextRequest) {
  const logger = createRequestLogger(request);

  try {
    // 验证用户身份
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权访问', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    // 验证请求体
    if (!body.action) {
      return NextResponse.json(
        { error: '缺少操作类型', code: 'MISSING_ACTION' },
        { status: 400 }
      );
    }

    const { action, notification_ids, read } = body;

    if (action === 'mark_read' || action === 'mark_unread') {
      const readStatus = action === 'mark_read';

      let updateQuery = supabase
        .from('notifications')
        .update({
          read: readStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      // 如果指定了通知ID，只更新指定的通知
      if (
        notification_ids &&
        Array.isArray(notification_ids) &&
        notification_ids.length > 0
      ) {
        updateQuery = updateQuery.in('id', notification_ids);
      }

      const { data, error, count } = await updateQuery.select();

      if (error) {
        logger.error('更新通知状态失败', { error: new Error(error.message) });
        return NextResponse.json(
          { error: '更新通知状态失败', code: 'UPDATE_ERROR' },
          { status: 500 }
        );
      }

      logger.info('批量更新通知状态成功', {
        userId,
        action,
        updatedCount: data?.length || 0,
        notificationIds: notification_ids,
      });

      return NextResponse.json({
        success: true,
        message: `成功${readStatus ? '标记为已读' : '标记为未读'} ${data?.length || 0} 条通知`,
        updated_count: data?.length || 0,
        updated_notifications: data,
      });
    }

    if (action === 'delete') {
      if (
        !notification_ids ||
        !Array.isArray(notification_ids) ||
        notification_ids.length === 0
      ) {
        return NextResponse.json(
          { error: '删除操作需要指定通知ID', code: 'MISSING_NOTIFICATION_IDS' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .in('id', notification_ids)
        .select();

      if (error) {
        logger.error('删除通知失败', { error: new Error(error.message) });
        return NextResponse.json(
          { error: '删除通知失败', code: 'DELETE_ERROR' },
          { status: 500 }
        );
      }

      logger.info('批量删除通知成功', {
        userId,
        deletedCount: data?.length || 0,
        notificationIds: notification_ids,
      });

      return NextResponse.json({
        success: true,
        message: `成功删除 ${data?.length || 0} 条通知`,
        deleted_count: data?.length || 0,
        deleted_notifications: data,
      });
    }

    return NextResponse.json(
      { error: '不支持的操作类型', code: 'UNSUPPORTED_ACTION' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('更新通知失败', { error: error as Error });
    return NextResponse.json(
      { error: '服务器内部错误', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * 获取用户通知中涉及的所有股票代码
 */
async function getAvailableSymbols(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('symbol')
      .eq('user_id', userId);

    if (error) {
      console.error('获取可用股票代码失败', error);
      return [];
    }

    // 去重并排序
    const symbols = [...new Set(data?.map(item => item.symbol) || [])];
    return symbols.sort();
  } catch (error) {
    console.error('获取可用股票代码失败', error);
    return [];
  }
}
