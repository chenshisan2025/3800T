import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { createRequestLogger } from '@/lib/logger';
import { z } from 'zod';

// 警报规则验证模式
const AlertRuleSchema = z.object({
  symbol: z
    .string()
    .min(1)
    .max(10)
    .transform(s => s.toUpperCase()),
  rule_type: z.enum(['price_above', 'price_below', 'price_change']),
  threshold: z.number().positive(),
  change_percent: z.number().positive().optional(),
  message: z.string().max(500).optional(),
  enabled: z.boolean().default(true),
});

const UpdateAlertRuleSchema = AlertRuleSchema.partial();

// 查询参数验证模式
const QuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  symbol: z.string().optional(),
  rule_type: z.enum(['price_above', 'price_below', 'price_change']).optional(),
  enabled: z.boolean().optional(),
});

/**
 * GET /api/alerts/rules
 * 获取用户的警报规则列表
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

    // 解析和验证查询参数
    const queryResult = QuerySchema.safeParse({
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 20,
      symbol: searchParams.get('symbol') || undefined,
      rule_type: searchParams.get('rule_type') || undefined,
      enabled: searchParams.get('enabled')
        ? searchParams.get('enabled') === 'true'
        : undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: '查询参数无效',
          code: 'INVALID_QUERY_PARAMS',
          details: queryResult.error.errors,
        },
        { status: 400 }
      );
    }

    const query = queryResult.data;

    // 构建查询
    let supabaseQuery = supabase
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
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 应用过滤条件
    if (query.symbol) {
      supabaseQuery = supabaseQuery.eq('symbol', query.symbol);
    }

    if (query.rule_type) {
      supabaseQuery = supabaseQuery.eq('rule_type', query.rule_type);
    }

    if (query.enabled !== undefined) {
      supabaseQuery = supabaseQuery.eq('enabled', query.enabled);
    }

    // 分页
    const offset = (query.page - 1) * query.limit;
    supabaseQuery = supabaseQuery.range(offset, offset + query.limit - 1);

    // 执行查询
    const { data: rules, error } = await supabaseQuery;

    if (error) {
      logger.error('获取警报规则失败', {
        error: new Error(error.message),
        userId,
        query,
      });
      return NextResponse.json(
        { error: '获取警报规则失败', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // 获取总数
    let countQuery = supabase
      .from('alert_rules')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (query.symbol) countQuery = countQuery.eq('symbol', query.symbol);
    if (query.rule_type)
      countQuery = countQuery.eq('rule_type', query.rule_type);
    if (query.enabled !== undefined)
      countQuery = countQuery.eq('enabled', query.enabled);

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      logger.error('获取警报规则总数失败', {
        error: new Error(countError.message),
        userId,
      });
    }

    // 统计信息
    const { data: stats } = await supabase
      .from('alert_rules')
      .select('rule_type, enabled')
      .eq('user_id', userId);

    const statistics = {
      total: totalCount || 0,
      enabled: stats?.filter(s => s.enabled).length || 0,
      disabled: stats?.filter(s => !s.enabled).length || 0,
      by_type: {
        price_above:
          stats?.filter(s => s.rule_type === 'price_above').length || 0,
        price_below:
          stats?.filter(s => s.rule_type === 'price_below').length || 0,
        price_change:
          stats?.filter(s => s.rule_type === 'price_change').length || 0,
      },
    };

    // 分页信息
    const pagination = {
      page: query.page,
      limit: query.limit,
      total: totalCount || 0,
      pages: Math.ceil((totalCount || 0) / query.limit),
      has_next: offset + query.limit < (totalCount || 0),
      has_prev: query.page > 1,
    };

    logger.info('获取警报规则列表成功', {
      userId,
      count: rules?.length || 0,
      query,
      statistics,
    });

    return NextResponse.json({
      success: true,
      data: rules || [],
      statistics,
      pagination,
    });
  } catch (error) {
    logger.error('获取警报规则时发生未知错误', { error });
    return NextResponse.json(
      { error: '服务器内部错误', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/alerts/rules
 * 创建新的警报规则
 */
export async function POST(request: NextRequest) {
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
    const validationResult = AlertRuleSchema.safeParse(body);
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

    const ruleData = validationResult.data;

    // 验证规则类型特定的字段
    if (ruleData.rule_type === 'price_change' && !ruleData.change_percent) {
      return NextResponse.json(
        {
          error: 'price_change 规则类型需要提供 change_percent 参数',
          code: 'MISSING_CHANGE_PERCENT',
        },
        { status: 400 }
      );
    }

    // 检查用户是否已有相同的规则（防重复）
    const { data: existingRules, error: checkError } = await supabase
      .from('alert_rules')
      .select('id')
      .eq('user_id', userId)
      .eq('symbol', ruleData.symbol)
      .eq('rule_type', ruleData.rule_type)
      .eq('threshold', ruleData.threshold);

    if (checkError) {
      logger.error('检查重复规则失败', {
        error: new Error(checkError.message),
        userId,
        symbol: ruleData.symbol,
      });
    } else if (existingRules && existingRules.length > 0) {
      return NextResponse.json(
        {
          error: '相同的警报规则已存在',
          code: 'DUPLICATE_RULE',
          existing_rule_id: existingRules[0].id,
        },
        { status: 409 }
      );
    }

    // 创建警报规则
    const { data: newRule, error } = await supabase
      .from('alert_rules')
      .insert({
        user_id: userId,
        symbol: ruleData.symbol,
        rule_type: ruleData.rule_type,
        threshold: ruleData.threshold,
        change_percent: ruleData.change_percent,
        message: ruleData.message,
        enabled: ruleData.enabled,
      })
      .select()
      .single();

    if (error) {
      logger.error('创建警报规则失败', {
        error: new Error(error.message),
        userId,
        ruleData,
      });
      return NextResponse.json(
        { error: '创建警报规则失败', code: 'CREATE_ERROR' },
        { status: 500 }
      );
    }

    logger.info('创建警报规则成功', {
      userId,
      ruleId: newRule.id,
      symbol: ruleData.symbol,
      ruleType: ruleData.rule_type,
      threshold: ruleData.threshold,
    });

    return NextResponse.json(
      {
        success: true,
        message: '警报规则创建成功',
        data: newRule,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('创建警报规则时发生未知错误', { error });
    return NextResponse.json(
      { error: '服务器内部错误', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
