import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import {
  generateIdempotencyKey,
  createNotificationWithIdempotency,
  performAlertScan,
} from '../lib/alert-engine';
import { supabase } from '../lib/supabase';
import logger from '../lib/logger';

// Mock dependencies
jest.mock('../lib/supabase');
jest.mock('../lib/logger');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('Idempotency Mechanism Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('generateIdempotencyKey', () => {
    it('should generate consistent keys for same user+symbol+rule+day', () => {
      const fixedDate = new Date('2024-01-15T10:30:45.123Z');
      jest.setSystemTime(fixedDate);

      const key1 = generateIdempotencyKey('user123', 'AAPL', 'rule456');
      const key2 = generateIdempotencyKey('user123', 'AAPL', 'rule456');

      expect(key1).toBe(key2);
      expect(key1).toBe('user123_AAPL_rule456_20240115');
    });

    it('should generate different keys for different days', () => {
      // Day 1
      jest.setSystemTime(new Date('2024-01-15T23:59:59.999Z'));
      const key1 = generateIdempotencyKey('user123', 'AAPL', 'rule456');

      // Day 2
      jest.setSystemTime(new Date('2024-01-16T00:00:00.001Z'));
      const key2 = generateIdempotencyKey('user123', 'AAPL', 'rule456');

      expect(key1).toBe('user123_AAPL_rule456_20240115');
      expect(key2).toBe('user123_AAPL_rule456_20240116');
      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different users', () => {
      const key1 = generateIdempotencyKey('user123', 'AAPL', 'rule456');
      const key2 = generateIdempotencyKey('user789', 'AAPL', 'rule456');

      expect(key1).not.toBe(key2);
      expect(key1).toContain('user123');
      expect(key2).toContain('user789');
    });

    it('should generate different keys for different symbols', () => {
      const key1 = generateIdempotencyKey('user123', 'AAPL', 'rule456');
      const key2 = generateIdempotencyKey('user123', 'GOOGL', 'rule456');

      expect(key1).not.toBe(key2);
      expect(key1).toContain('AAPL');
      expect(key2).toContain('GOOGL');
    });

    it('should generate different keys for different rules', () => {
      const key1 = generateIdempotencyKey('user123', 'AAPL', 'rule456');
      const key2 = generateIdempotencyKey('user123', 'AAPL', 'rule789');

      expect(key1).not.toBe(key2);
      expect(key1).toContain('rule456');
      expect(key2).toContain('rule789');
    });

    it('should handle timezone changes correctly', () => {
      // Same UTC day, different local times
      jest.setSystemTime(new Date('2024-01-15T02:00:00.000Z')); // Early UTC
      const key1 = generateIdempotencyKey('user123', 'AAPL', 'rule456');

      jest.setSystemTime(new Date('2024-01-15T22:00:00.000Z')); // Late UTC
      const key2 = generateIdempotencyKey('user123', 'AAPL', 'rule456');

      expect(key1).toBe(key2); // Same UTC date
      expect(key1).toContain('20240115');
    });
  });

  describe('createNotificationWithIdempotency', () => {
    const mockNotificationData = {
      userId: 'user123',
      ruleId: 'rule456',
      symbol: 'AAPL',
      ruleType: 'price_above' as const,
      triggerPrice: 150,
      currentPrice: 155,
      title: 'AAPL Price Alert',
      message: 'AAPL is now $155, above your threshold of $150',
    };

    it('should create notification when no duplicate exists', async () => {
      const mockRpcResponse = {
        data: {
          success: true,
          notification_id: 'notif_12345',
          was_duplicate: false,
        },
        error: null,
      };

      mockSupabase.rpc.mockResolvedValue(mockRpcResponse);

      const result = await createNotificationWithIdempotency(
        mockNotificationData.userId,
        mockNotificationData.ruleId,
        mockNotificationData.symbol,
        mockNotificationData.ruleType,
        mockNotificationData.triggerPrice,
        mockNotificationData.currentPrice,
        mockNotificationData.title,
        mockNotificationData.message
      );

      expect(result.success).toBe(true);
      expect(result.notificationId).toBe('notif_12345');
      expect(result.wasDuplicate).toBe(false);

      // Verify the stored procedure was called with correct parameters
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'create_notification_with_idempotency',
        expect.objectContaining({
          p_user_id: 'user123',
          p_rule_id: 'rule456',
          p_symbol: 'AAPL',
          p_rule_type: 'price_above',
          p_trigger_price: 150,
          p_current_price: 155,
          p_title: 'AAPL Price Alert',
          p_message: 'AAPL is now $155, above your threshold of $150',
          p_idempotency_key: expect.stringMatching(
            /^user123_AAPL_rule456_\d{8}$/
          ),
        })
      );
    });

    it('should detect duplicate notification within same day', async () => {
      const mockRpcResponse = {
        data: {
          success: true,
          notification_id: null,
          was_duplicate: true,
        },
        error: null,
      };

      mockSupabase.rpc.mockResolvedValue(mockRpcResponse);

      const result = await createNotificationWithIdempotency(
        mockNotificationData.userId,
        mockNotificationData.ruleId,
        mockNotificationData.symbol,
        mockNotificationData.ruleType,
        mockNotificationData.triggerPrice,
        mockNotificationData.currentPrice,
        mockNotificationData.title,
        mockNotificationData.message
      );

      expect(result.success).toBe(true);
      expect(result.notificationId).toBeNull();
      expect(result.wasDuplicate).toBe(true);
    });

    it('should allow same notification on different days', async () => {
      // Day 1 - Create notification
      jest.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));

      const mockRpcResponse1 = {
        data: {
          success: true,
          notification_id: 'notif_day1',
          was_duplicate: false,
        },
        error: null,
      };

      mockSupabase.rpc.mockResolvedValueOnce(mockRpcResponse1);

      const result1 = await createNotificationWithIdempotency(
        mockNotificationData.userId,
        mockNotificationData.ruleId,
        mockNotificationData.symbol,
        mockNotificationData.ruleType,
        mockNotificationData.triggerPrice,
        mockNotificationData.currentPrice,
        mockNotificationData.title,
        mockNotificationData.message
      );

      expect(result1.success).toBe(true);
      expect(result1.wasDuplicate).toBe(false);

      // Day 2 - Same notification should be allowed
      jest.setSystemTime(new Date('2024-01-16T10:00:00.000Z'));

      const mockRpcResponse2 = {
        data: {
          success: true,
          notification_id: 'notif_day2',
          was_duplicate: false,
        },
        error: null,
      };

      mockSupabase.rpc.mockResolvedValueOnce(mockRpcResponse2);

      const result2 = await createNotificationWithIdempotency(
        mockNotificationData.userId,
        mockNotificationData.ruleId,
        mockNotificationData.symbol,
        mockNotificationData.ruleType,
        mockNotificationData.triggerPrice,
        mockNotificationData.currentPrice,
        mockNotificationData.title,
        mockNotificationData.message
      );

      expect(result2.success).toBe(true);
      expect(result2.wasDuplicate).toBe(false);
      expect(result2.notificationId).toBe('notif_day2');

      // Verify different idempotency keys were used
      const calls = mockSupabase.rpc.mock.calls;
      expect(calls[0][1].p_idempotency_key).toContain('20240115');
      expect(calls[1][1].p_idempotency_key).toContain('20240116');
    });

    it('should handle database errors gracefully', async () => {
      const mockRpcResponse = {
        data: null,
        error: {
          message: 'Connection timeout',
          code: 'CONNECTION_ERROR',
        },
      };

      mockSupabase.rpc.mockResolvedValue(mockRpcResponse);

      const result = await createNotificationWithIdempotency(
        mockNotificationData.userId,
        mockNotificationData.ruleId,
        mockNotificationData.symbol,
        mockNotificationData.ruleType,
        mockNotificationData.triggerPrice,
        mockNotificationData.currentPrice,
        mockNotificationData.title,
        mockNotificationData.message
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection timeout');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle stored procedure exceptions', async () => {
      const mockRpcResponse = {
        data: {
          success: false,
          error_message: 'Invalid user_id format',
        },
        error: null,
      };

      mockSupabase.rpc.mockResolvedValue(mockRpcResponse);

      const result = await createNotificationWithIdempotency(
        'invalid_user',
        mockNotificationData.ruleId,
        mockNotificationData.symbol,
        mockNotificationData.ruleType,
        mockNotificationData.triggerPrice,
        mockNotificationData.currentPrice,
        mockNotificationData.title,
        mockNotificationData.message
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid user_id format');
    });
  });

  describe('Idempotency in Alert Scan Process', () => {
    it('should prevent duplicate notifications during scan', async () => {
      const mockRules = [
        {
          id: 'rule1',
          user_id: 'user123',
          symbol: 'AAPL',
          rule_type: 'price_above' as const,
          threshold: 150,
          change_percent: null,
          message: 'AAPL above $150',
          enabled: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      // Mock getting active rules
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockRules,
            error: null,
          }),
        }),
      } as any);

      // Mock scan log creation
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'scan_log_1' },
              error: null,
            }),
          }),
        }),
      } as any);

      // Mock first notification creation (success)
      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          success: true,
          notification_id: 'notif_1',
          was_duplicate: false,
        },
        error: null,
      });

      // Mock scan log update
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any);

      // First scan
      const result1 = await performAlertScan();
      expect(result1.success).toBe(true);
      expect(result1.notificationsCreated).toBe(1);

      // Reset mocks for second scan
      jest.clearAllMocks();

      // Mock getting same active rules
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockRules,
            error: null,
          }),
        }),
      } as any);

      // Mock scan log creation
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'scan_log_2' },
              error: null,
            }),
          }),
        }),
      } as any);

      // Mock second notification creation (duplicate detected)
      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          success: true,
          notification_id: null,
          was_duplicate: true,
        },
        error: null,
      });

      // Mock scan log update
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any);

      // Second scan (same day) - should detect duplicate
      const result2 = await performAlertScan();
      expect(result2.success).toBe(true);
      expect(result2.notificationsCreated).toBe(0); // No new notifications due to idempotency
    });

    it('should allow notifications across day boundaries', async () => {
      const mockRules = [
        {
          id: 'rule1',
          user_id: 'user123',
          symbol: 'AAPL',
          rule_type: 'price_above' as const,
          threshold: 150,
          change_percent: null,
          message: 'AAPL above $150',
          enabled: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      // Day 1 scan
      jest.setSystemTime(new Date('2024-01-15T23:30:00.000Z'));

      // Mock getting active rules
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockRules,
            error: null,
          }),
        }),
      } as any);

      // Mock scan log creation
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'scan_log_day1' },
              error: null,
            }),
          }),
        }),
      } as any);

      // Mock notification creation (day 1)
      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          success: true,
          notification_id: 'notif_day1',
          was_duplicate: false,
        },
        error: null,
      });

      // Mock scan log update
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any);

      const result1 = await performAlertScan();
      expect(result1.notificationsCreated).toBe(1);

      // Day 2 scan
      jest.setSystemTime(new Date('2024-01-16T00:30:00.000Z'));
      jest.clearAllMocks();

      // Mock getting same active rules
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockRules,
            error: null,
          }),
        }),
      } as any);

      // Mock scan log creation
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'scan_log_day2' },
              error: null,
            }),
          }),
        }),
      } as any);

      // Mock notification creation (day 2 - should succeed)
      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          success: true,
          notification_id: 'notif_day2',
          was_duplicate: false,
        },
        error: null,
      });

      // Mock scan log update
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any);

      const result2 = await performAlertScan();
      expect(result2.notificationsCreated).toBe(1); // New notification allowed on new day
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle concurrent notification attempts', async () => {
      // This test simulates race conditions where multiple processes
      // try to create the same notification simultaneously

      const notificationPromises = [];

      // Mock responses - first succeeds, second detects duplicate
      mockSupabase.rpc
        .mockResolvedValueOnce({
          data: {
            success: true,
            notification_id: 'notif_winner',
            was_duplicate: false,
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
            notification_id: null,
            was_duplicate: true,
          },
          error: null,
        });

      // Simulate concurrent calls
      for (let i = 0; i < 2; i++) {
        notificationPromises.push(
          createNotificationWithIdempotency(
            'user123',
            'rule456',
            'AAPL',
            'price_above',
            150,
            155,
            'AAPL Alert',
            'Price alert message'
          )
        );
      }

      const results = await Promise.all(notificationPromises);

      // One should succeed, one should be duplicate
      const successCount = results.filter(
        r => r.success && !r.wasDuplicate
      ).length;
      const duplicateCount = results.filter(
        r => r.success && r.wasDuplicate
      ).length;

      expect(successCount).toBe(1);
      expect(duplicateCount).toBe(1);
    });

    it('should handle malformed idempotency keys gracefully', async () => {
      // Test with edge case inputs
      const edgeCases = [
        { userId: '', symbol: 'AAPL', ruleId: 'rule1' },
        { userId: 'user123', symbol: '', ruleId: 'rule1' },
        { userId: 'user123', symbol: 'AAPL', ruleId: '' },
        {
          userId: 'user_with_special_chars!@#',
          symbol: 'AAPL',
          ruleId: 'rule1',
        },
        { userId: 'user123', symbol: 'SYMBOL.WITH.DOTS', ruleId: 'rule1' },
      ];

      edgeCases.forEach(({ userId, symbol, ruleId }) => {
        const key = generateIdempotencyKey(userId, symbol, ruleId);
        expect(typeof key).toBe('string');
        expect(key.length).toBeGreaterThan(0);
        expect(key).toMatch(/^.*_.*_.*_\d{8}$/);
      });
    });

    it('should maintain idempotency across system restarts', async () => {
      // This test verifies that idempotency works even if the application restarts
      // The key generation should be deterministic based on date

      const fixedDate = new Date('2024-01-15T10:00:00.000Z');

      // Simulate first process
      jest.setSystemTime(fixedDate);
      const key1 = generateIdempotencyKey('user123', 'AAPL', 'rule456');

      // Simulate system restart (clear any in-memory state)
      jest.clearAllMocks();

      // Simulate second process with same time
      jest.setSystemTime(fixedDate);
      const key2 = generateIdempotencyKey('user123', 'AAPL', 'rule456');

      expect(key1).toBe(key2);
      expect(key1).toBe('user123_AAPL_rule456_20240115');
    });
  });
});
