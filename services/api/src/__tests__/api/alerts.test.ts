import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import {
  GET as getRules,
  POST as createRule,
} from '../../app/api/alerts/rules/route';
import {
  GET as getRule,
  PUT as updateRule,
  DELETE as deleteRule,
  PATCH as patchRule,
} from '../../app/api/alerts/rules/[id]/route';
import {
  GET as getNotifications,
  PATCH as updateNotifications,
} from '../../app/api/me/notifications/route';
import {
  GET as getScanStatus,
  POST as triggerScan,
} from '../../app/api/alerts/scan/route';
import { supabase } from '../../lib/supabase';
import { performAlertScan } from '../../lib/alert-engine';

// Mock dependencies
jest.mock('next-auth');
jest.mock('../../lib/supabase');
jest.mock('../../lib/alert-engine');
jest.mock('../../lib/logger');

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockPerformAlertScan = performAlertScan as jest.MockedFunction<
  typeof performAlertScan
>;

// Helper function to create mock request
function createMockRequest(
  method: string,
  body?: any,
  searchParams?: Record<string, string>
) {
  const url = new URL('http://localhost:3000/api/test');
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return {
    method,
    json: jest.fn().mockResolvedValue(body || {}),
    url: url.toString(),
    nextUrl: url,
  } as unknown as NextRequest;
}

// Mock session data
const mockSession = {
  user: {
    id: 'user123',
    email: 'test@example.com',
    name: 'Test User',
  },
};

describe('Alert Rules API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue(mockSession);
  });

  describe('GET /api/alerts/rules', () => {
    it('should return user alert rules with pagination', async () => {
      const mockRules = [
        {
          id: 'rule1',
          user_id: 'user123',
          symbol: 'AAPL',
          rule_type: 'price_above',
          threshold: 150,
          change_percent: null,
          message: 'AAPL above $150',
          enabled: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'rule2',
          user_id: 'user123',
          symbol: 'GOOGL',
          rule_type: 'price_below',
          threshold: 2500,
          change_percent: null,
          message: 'GOOGL below $2500',
          enabled: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockRules,
                error: null,
                count: 2,
              }),
            }),
          }),
        }),
      } as any);

      const request = createMockRequest('GET', null, {
        page: '1',
        limit: '10',
      });
      const response = await getRules(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.rules).toHaveLength(2);
      expect(responseData.data.pagination.total).toBe(2);
      expect(responseData.data.statistics.total).toBe(2);
      expect(responseData.data.statistics.enabled).toBe(1);
      expect(responseData.data.statistics.disabled).toBe(1);
    });

    it('should filter rules by symbol', async () => {
      const mockRules = [
        {
          id: 'rule1',
          user_id: 'user123',
          symbol: 'AAPL',
          rule_type: 'price_above',
          threshold: 150,
          change_percent: null,
          message: 'AAPL above $150',
          enabled: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockRules,
                  error: null,
                  count: 1,
                }),
              }),
            }),
          }),
        }),
      } as any);

      const request = createMockRequest('GET', null, { symbol: 'AAPL' });
      const response = await getRules(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.rules).toHaveLength(1);
      expect(responseData.data.rules[0].symbol).toBe('AAPL');
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createMockRequest('GET');
      const response = await getRules(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('未授权访问');
    });
  });

  describe('POST /api/alerts/rules', () => {
    it('should create new alert rule successfully', async () => {
      const newRule = {
        symbol: 'AAPL',
        rule_type: 'price_above',
        threshold: 150,
        message: 'AAPL above $150',
      };

      const createdRule = {
        id: 'rule123',
        user_id: 'user123',
        ...newRule,
        change_percent: null,
        enabled: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock duplicate check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Mock insert
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: createdRule,
              error: null,
            }),
          }),
        }),
      } as any);

      const request = createMockRequest('POST', newRule);
      const response = await createRule(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data.symbol).toBe('AAPL');
      expect(responseData.data.rule_type).toBe('price_above');
    });

    it('should return 409 when duplicate rule exists', async () => {
      const newRule = {
        symbol: 'AAPL',
        rule_type: 'price_above',
        threshold: 150,
        message: 'AAPL above $150',
      };

      // Mock duplicate check - return existing rule
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [{ id: 'existing_rule' }],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      const request = createMockRequest('POST', newRule);
      const response = await createRule(request);
      const responseData = await response.json();

      expect(response.status).toBe(409);
      expect(responseData.error).toBe('相同的警报规则已存在');
    });

    it('should validate price_change rule requires change_percent', async () => {
      const newRule = {
        symbol: 'AAPL',
        rule_type: 'price_change',
        threshold: 150,
        // Missing change_percent
      };

      const request = createMockRequest('POST', newRule);
      const response = await createRule(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe(
        'price_change 规则类型需要提供 change_percent 参数'
      );
    });
  });

  describe('GET /api/alerts/rules/[id]', () => {
    it('should return specific alert rule with statistics', async () => {
      const mockRule = {
        id: 'rule123',
        user_id: 'user123',
        symbol: 'AAPL',
        rule_type: 'price_above',
        threshold: 150,
        change_percent: null,
        message: 'AAPL above $150',
        enabled: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockNotifications = [
        { id: 'notif1', created_at: '2024-01-02T00:00:00Z' },
        { id: 'notif2', created_at: '2024-01-01T00:00:00Z' },
      ];

      // Mock rule fetch
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockRule,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      // Mock notifications fetch
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockNotifications,
              error: null,
            }),
          }),
        }),
      } as any);

      const response = await getRule(createMockRequest('GET'), {
        params: { id: 'rule123' },
      });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.id).toBe('rule123');
      expect(responseData.data.statistics.total_notifications).toBe(2);
      expect(responseData.data.statistics.last_triggered).toBe(
        '2024-01-02T00:00:00Z'
      );
    });

    it('should return 404 when rule not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          }),
        }),
      } as any);

      const response = await getRule(createMockRequest('GET'), {
        params: { id: 'nonexistent' },
      });
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe('警报规则不存在');
    });
  });

  describe('DELETE /api/alerts/rules/[id]', () => {
    it('should delete alert rule successfully', async () => {
      const mockRule = {
        id: 'rule123',
        symbol: 'AAPL',
        rule_type: 'price_above',
        threshold: 150,
      };

      // Mock rule existence check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockRule,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      // Mock notification count
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: 3,
              error: null,
            }),
          }),
        }),
      } as any);

      // Mock delete
      mockSupabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      } as any);

      const response = await deleteRule(createMockRequest('DELETE'), {
        params: { id: 'rule123' },
      });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.deleted_rule_id).toBe('rule123');
      expect(responseData.data.related_notifications).toBe(3);
    });
  });
});

describe('Notifications API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue(mockSession);
  });

  describe('GET /api/me/notifications', () => {
    it('should return user notifications with pagination', async () => {
      const mockNotifications = [
        {
          id: 'notif1',
          user_id: 'user123',
          rule_id: 'rule1',
          symbol: 'AAPL',
          rule_type: 'price_above',
          trigger_price: 150,
          current_price: 155,
          type: 'price_alert',
          title: 'AAPL Price Alert',
          message: 'AAPL is now $155',
          read: false,
          notification_date: '2024-01-01',
          priority: 'medium',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      // Mock notifications query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockNotifications,
                error: null,
                count: 1,
              }),
            }),
          }),
        }),
      } as any);

      // Mock symbols query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ symbol: 'AAPL' }],
            error: null,
          }),
        }),
      } as any);

      const request = createMockRequest('GET', null, {
        page: '1',
        limit: '10',
      });
      const response = await getNotifications(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.notifications).toHaveLength(1);
      expect(responseData.data.statistics.total).toBe(1);
      expect(responseData.data.available_symbols).toContain('AAPL');
    });

    it('should filter notifications by read status', async () => {
      const mockNotifications = [
        {
          id: 'notif1',
          read: false,
          symbol: 'AAPL',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockNotifications,
                  error: null,
                  count: 1,
                }),
              }),
            }),
          }),
        }),
      } as any);

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ symbol: 'AAPL' }],
            error: null,
          }),
        }),
      } as any);

      const request = createMockRequest('GET', null, { read: 'false' });
      const response = await getNotifications(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.notifications).toHaveLength(1);
      expect(responseData.data.notifications[0].read).toBe(false);
    });
  });

  describe('PATCH /api/me/notifications', () => {
    it('should mark notifications as read', async () => {
      const updateData = {
        action: 'mark_read',
        notification_ids: ['notif1', 'notif2'],
      };

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: [{ id: 'notif1' }, { id: 'notif2' }],
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const request = createMockRequest('PATCH', updateData);
      const response = await updateNotifications(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.updated_count).toBe(2);
    });

    it('should delete notifications', async () => {
      const updateData = {
        action: 'delete',
        notification_ids: ['notif1'],
      };

      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      } as any);

      const request = createMockRequest('PATCH', updateData);
      const response = await updateNotifications(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
    });
  });
});

describe('Alert Scan API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue(mockSession);
  });

  describe('POST /api/alerts/scan', () => {
    it('should trigger alert scan successfully', async () => {
      const mockScanResult = {
        scanId: 'scan_20240101_120000_abcd1234',
        success: true,
        rulesProcessed: 5,
        notificationsCreated: 2,
        errors: [],
        executionTime: 1500,
      };

      mockPerformAlertScan.mockResolvedValue(mockScanResult);

      const request = createMockRequest('POST');
      const response = await triggerScan(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.scan_id).toBe('scan_20240101_120000_abcd1234');
      expect(responseData.data.rules_processed).toBe(5);
      expect(responseData.data.notifications_created).toBe(2);
    });

    it('should handle scan failure', async () => {
      const mockScanResult = {
        scanId: 'scan_20240101_120000_abcd1234',
        success: false,
        rulesProcessed: 0,
        notificationsCreated: 0,
        errors: ['Database connection failed'],
        executionTime: 500,
      };

      mockPerformAlertScan.mockResolvedValue(mockScanResult);

      const request = createMockRequest('POST');
      const response = await triggerScan(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.errors).toContain('Database connection failed');
    });
  });

  describe('GET /api/alerts/scan', () => {
    it('should return scan status and history', async () => {
      const mockScanLogs = [
        {
          id: 'log1',
          scan_id: 'scan_20240101_120000_abcd1234',
          status: 'completed',
          rules_processed: 5,
          notifications_created: 2,
          execution_time_ms: 1500,
          created_at: '2024-01-01T12:00:00Z',
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: mockScanLogs,
              error: null,
            }),
          }),
        }),
      } as any);

      const request = createMockRequest('GET');
      const response = await getScanStatus(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.recent_scans).toHaveLength(1);
      expect(responseData.data.statistics.total_scans).toBe(1);
    });
  });
});
