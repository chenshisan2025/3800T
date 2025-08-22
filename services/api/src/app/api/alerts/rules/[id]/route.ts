import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { createRequestLogger } from '@/lib/logger';
import { z } from 'zod';

// 更新警报规则验证模式
const UpdateAlertRuleSchema = z.object({
  symbol: z
    .string()
    .min(1)
    .max(10)
    .transform(s => s.toUpperCase())
    .optional(),
  rule_type: z.enum(['price_above', 'price_below', 'price_change']).optional(),
  threshold: z.number().positive().optional(),
  change_percent: z.number().positive().optional(),
  message: z.string().max(500).optional(),
  enabled: z.boolean().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/alerts/rules/[id]
 * 获取特定的警报规则
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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
    const ruleId = params.id;

    // 验证规则ID格式
    if (!ruleId || typeof ruleId !== 'string') {
      return NextResponse.json(
        { error: '无效的规则ID', code: 'INVALID_RULE_ID' },
        { status: 400 }
      );
    }

    // 获取警报规则
    const { data: rule, error } = await supabase
      .from('alert_rules')
      .select(
        `
        id,
        user_id,
        symbol,
        rule_type,
        threshold,
        change_percent,
        message,
        enabled,
        created_at,
        updated_at
      `
      )
      .eq('id', ruleId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '警报规则不存在', code: 'RULE_NOT_FOUND' },
          { status: 404 }
        );
      }
      logger.error('获取警报规则失败', { error: new Error(error.message) });
      return NextResponse.json(
        { error: '获取警报规则失败', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // 获取相关的通知统计
    const { data: notificationStats } = await supabase
      .from('notifications')
      .select('id, created_at')
      .eq('rule_id', ruleId)
      .eq('user_id', userId);

    const stats = {
      total_notifications: notificationStats?.length || 0,
      last_triggered:
        notificationStats && notificationStats.length > 0
          ? notificationStats.sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )[0].created_at
          : null,
    };

    logger.info('获取警报规则成功', {
      userId,
      ruleId,
      symbol: rule.symbol,
      ruleType: rule.rule_type,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...rule,
        statistics: stats,
      },
    });
  } catch (error) {
    logger.error('获取警报规则失败', { error: error as Error });
    return NextResponse.json(
      { error: '服务器内部错误', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/alerts/rules/[id]
 * 更新特定的警报规则
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const ruleId = params.id;
    const body = await request.json();

    // 验证规则ID格式
    if (!ruleId || typeof ruleId !== 'string') {
      return NextResponse.json(
        { error: '无效的规则ID', code: 'INVALID_RULE_ID' },
        { status: 400 }
      );
    }

    // 验证请求体
    const validationResult = UpdateAlertRuleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: '请求数据无效',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // 验证规则类型特定的字段
    if (
      updateData.rule_type === 'price_change' &&
      updateData.change_percent === undefined
    ) {
      // 如果更新为price_change类型，需要检查是否提供了change_percent
      const { data: currentRule } = await supabase
        .from('alert_rules')
        .select('change_percent')
        .eq('id', ruleId)
        .eq('user_id', userId)
        .single();

      if (!currentRule?.change_percent && !updateData.change_percent) {
        return NextResponse.json(
          {
            error: 'price_change 规则类型需要提供 change_percent 参数',
            code: 'MISSING_CHANGE_PERCENT',
          },
          { status: 400 }
        );
      }
    }

    // 检查规则是否存在且属于当前用户
    const { data: existingRule, error: checkError } = await supabase
      .from('alert_rules')
      .select('id, symbol, rule_type, threshold')
      .eq('id', ruleId)
      .eq('user_id', userId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '警报规则不存在', code: 'RULE_NOT_FOUND' },
          { status: 404 }
        );
      }
      logger.error('检查规则失败', { error: new Error(checkError.message) });
      return NextResponse.json(
        { error: '检查规则失败', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // 检查是否会产生重复规则
    if (updateData.symbol || updateData.rule_type || updateData.threshold) {
      const newSymbol = updateData.symbol || existingRule.symbol;
      const newRuleType = updateData.rule_type || existingRule.rule_type;
      const newThreshold = updateData.threshold || existingRule.threshold;

      const { data: duplicateRules } = await supabase
        .from('alert_rules')
        .select('id')
        .eq('user_id', userId)
        .eq('symbol', newSymbol)
        .eq('rule_type', newRuleType)
        .eq('threshold', newThreshold)
        .neq('id', ruleId);

      if (duplicateRules && duplicateRules.length > 0) {
        return NextResponse.json(
          {
            error: '更新后的规则与现有规则重复',
            code: 'DUPLICATE_RULE',
            existing_rule_id: duplicateRules[0].id,
          },
          { status: 409 }
        );
      }
    }

    // 更新警报规则
    const { data: updatedRule, error } = await supabase
      .from('alert_rules')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ruleId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('更新警报规则失败', { error: new Error(error.message) });
      return NextResponse.json(
        { error: '更新警报规则失败', code: 'UPDATE_ERROR' },
        { status: 500 }
      );
    }

    logger.info('更新警报规则成功', {
      userId,
      ruleId,
      updateData,
      symbol: updatedRule.symbol,
      ruleType: updatedRule.rule_type,
    });

    return NextResponse.json({
      success: true,
      message: '警报规则更新成功',
      data: updatedRule,
    });
  } catch (error) {
    logger.error('更新警报规则失败', { error: error as Error });
    return NextResponse.json(
      { error: '服务器内部错误', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/alerts/rules/[id]
 * 删除特定的警报规则
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
    const ruleId = params.id;

    // 验证规则ID格式
    if (!ruleId || typeof ruleId !== 'string') {
      return NextResponse.json(
        { error: '无效的规则ID', code: 'INVALID_RULE_ID' },
        { status: 400 }
      );
    }

    // 检查规则是否存在且属于当前用户
    const { data: existingRule, error: checkError } = await supabase
      .from('alert_rules')
      .select('id, symbol, rule_type, threshold')
      .eq('id', ruleId)
      .eq('user_id', userId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '警报规则不存在', code: 'RULE_NOT_FOUND' },
          { status: 404 }
        );
      }
      logger.error('检查规则失败', { error: new Error(checkError.message) });
      return NextResponse.json(
        { error: '检查规则失败', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // 获取相关通知数量（用于日志记录）
    const { count: notificationCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('rule_id', ruleId)
      .eq('user_id', userId);

    // 删除警报规则（相关的通知和幂等记录会通过外键级联删除或保留用于历史记录）
    const { error } = await supabase
      .from('alert_rules')
      .delete()
      .eq('id', ruleId)
      .eq('user_id', userId);

    if (error) {
      logger.error('删除警报规则失败', { error: new Error(error.message) });
      return NextResponse.json(
        { error: '删除警报规则失败', code: 'DELETE_ERROR' },
        { status: 500 }
      );
    }

    logger.info('删除警报规则成功', {
      userId,
      ruleId,
      symbol: existingRule.symbol,
      ruleType: existingRule.rule_type,
      threshold: existingRule.threshold,
      relatedNotifications: notificationCount || 0,
    });

    return NextResponse.json({
      success: true,
      message: '警报规则删除成功',
      data: {
        deleted_rule_id: ruleId,
        related_notifications: notificationCount || 0,
      },
    });
  } catch (error) {
    logger.error('删除警报规则失败', { error: error as Error });
    return NextResponse.json(
      { error: '服务器内部错误', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/alerts/rules/[id]
 * 部分更新警报规则（如启用/禁用）
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const ruleId = params.id;
    const body = await request.json();

    // 验证规则ID格式
    if (!ruleId || typeof ruleId !== 'string') {
      return NextResponse.json(
        { error: '无效的规则ID', code: 'INVALID_RULE_ID' },
        { status: 400 }
      );
    }

    // 支持的操作
    const { action, enabled } = body;

    if (action === 'toggle' || enabled !== undefined) {
      // 切换启用/禁用状态
      const { data: currentRule, error: getCurrentError } = await supabase
        .from('alert_rules')
        .select('enabled')
        .eq('id', ruleId)
        .eq('user_id', userId)
        .single();

      if (getCurrentError) {
        if (getCurrentError.code === 'PGRST116') {
          return NextResponse.json(
            { error: '警报规则不存在', code: 'RULE_NOT_FOUND' },
            { status: 404 }
          );
        }
        logger.error('获取当前规则状态失败', {
          error: new Error(getCurrentError.message),
        });
        return NextResponse.json(
          { error: '获取当前规则状态失败', code: 'DATABASE_ERROR' },
          { status: 500 }
        );
      }

      const newEnabledState =
        enabled !== undefined ? enabled : !currentRule.enabled;

      const { data: updatedRule, error } = await supabase
        .from('alert_rules')
        .update({
          enabled: newEnabledState,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ruleId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('更新规则状态失败', { error: new Error(error.message) });
        return NextResponse.json(
          { error: '更新规则状态失败', code: 'UPDATE_ERROR' },
          { status: 500 }
        );
      }

      logger.info('切换警报规则状态成功', {
        userId,
        ruleId,
        oldState: currentRule.enabled,
        newState: newEnabledState,
      });

      return NextResponse.json({
        success: true,
        message: `警报规则已${newEnabledState ? '启用' : '禁用'}`,
        data: updatedRule,
      });
    }

    return NextResponse.json(
      { error: '不支持的操作', code: 'UNSUPPORTED_ACTION' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('更新警报规则失败', { error: error as Error });
    return NextResponse.json(
      { error: '服务器内部错误', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
