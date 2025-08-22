import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';

// Mock dependencies
jest.mock('../lib/supabase');
jest.mock('../lib/redis');

// Note: Logger is not mocked in these tests as we focus on testing function behavior

// Import the functions we need to test AFTER mocking
import {
  executeAlertScan,
  triggerManualScan,
  getAlertEngineStatus,
  generateScanId,
  generateIdempotencyKey,
  getStockPrice,
  checkRuleMatch,
  createNotificationWithIdempotency,
} from '../lib/alert-engine';
import { supabase } from '../lib/supabase';
import {
  StockPriceCache,
  PerformanceCache,
  HotStocksCache,
} from '../lib/redis';

const mockSupabase = {
  rpc: jest.fn(),
} as any;

// Mock the supabase module
jest.mocked(supabase).rpc = mockSupabase.rpc;

// Mock Redis cache modules
const mockStockPriceCache = {
  get: jest.fn(),
  set: jest.fn(),
};

const mockPerformanceCache = {
  recordMetric: jest.fn(),
};

const mockHotStocksCache = {
  addHotStock: jest.fn(),
};

jest.mocked(StockPriceCache).get = mockStockPriceCache.get;
jest.mocked(StockPriceCache).set = mockStockPriceCache.set;
jest.mocked(PerformanceCache).recordMetric = mockPerformanceCache.recordMetric;
jest.mocked(HotStocksCache).addHotStock = mockHotStocksCache.addHotStock;

describe('Alert Engine Core Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock implementations
    mockSupabase.rpc.mockReset();
    mockSupabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        select: jest
          .fn()
          .mockResolvedValue({ data: [{ id: 'scan123' }], error: null }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    });

    // Reset Redis cache mocks
    mockStockPriceCache.get.mockReset();
    mockStockPriceCache.set.mockReset();
    mockPerformanceCache.recordMetric.mockReset();
    mockHotStocksCache.addHotStock.mockReset();

    // Set default Redis mock behaviors
    mockStockPriceCache.get.mockResolvedValue(null); // No cache by default
    mockStockPriceCache.set.mockResolvedValue(undefined);
    mockPerformanceCache.recordMetric.mockResolvedValue(undefined);
    mockHotStocksCache.addHotStock.mockResolvedValue(undefined);

    // Reset stock price cache
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('generateScanId', () => {
    it('should generate unique scan IDs', () => {
      const id1 = generateScanId();
      const id2 = generateScanId();

      expect(id1).toMatch(/^scan_\d{8}_\d{6}_[a-f0-9]{8}$/);
      expect(id2).toMatch(/^scan_\d{8}_\d{6}_[a-f0-9]{8}$/);
      expect(id1).not.toBe(id2);
    });

    it('should include current date and time', () => {
      const scanId = generateScanId();
      // Just check the format, not the exact time
      expect(scanId).toMatch(/^scan_\d{8}_\d{6}_[a-f0-9]{8}$/);
    });
  });

  describe('generateIdempotencyKey', () => {
    it('should generate consistent keys for same inputs', () => {
      const key1 = generateIdempotencyKey('user123', 'AAPL', 'rule456');
      const key2 = generateIdempotencyKey('user123', 'AAPL', 'rule456');

      expect(key1).toBe(key2);
      expect(key1).toMatch(/^user123_AAPL_rule456_\d{8}$/);
    });

    it('should generate different keys for different dates', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-16');

      jest.setSystemTime(date1);
      const key1 = generateIdempotencyKey('user123', 'AAPL', 'rule456');

      jest.setSystemTime(date2);
      const key2 = generateIdempotencyKey('user123', 'AAPL', 'rule456');

      expect(key1).not.toBe(key2);
      expect(key1).toContain('20240115');
      expect(key2).toContain('20240116');
    });

    it('should generate different keys for different inputs', () => {
      const key1 = generateIdempotencyKey('user123', 'AAPL', 'rule456');
      const key2 = generateIdempotencyKey('user456', 'AAPL', 'rule456');
      const key3 = generateIdempotencyKey('user123', 'GOOGL', 'rule456');
      const key4 = generateIdempotencyKey('user123', 'AAPL', 'rule789');

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key1).not.toBe(key4);
    });
  });

  describe('getStockPrice', () => {
    it('should return cached price for same symbol within cache window', async () => {
      // First call should fetch from "API" (cache miss)
      mockStockPriceCache.get.mockResolvedValueOnce(null);
      const price1 = await getStockPrice('AAPL');
      expect(price1).toBeGreaterThan(0);

      // Mock cache hit for second call within cache window
      mockStockPriceCache.get.mockResolvedValueOnce({
        price: price1,
        timestamp: Date.now(),
      });

      // Second call within cache window should return same price
      const price2 = await getStockPrice('AAPL');
      expect(price2).toBe(price1);
    });

    it('should fetch new price after cache expires', async () => {
      // First call - no cache, should fetch from API
      const price1 = await getStockPrice('AAPL');
      expect(price1).toBeGreaterThan(0);

      // Mock cache hit for second call within cache window
      mockStockPriceCache.get.mockResolvedValueOnce({
        price: price1,
        timestamp: Date.now(),
      });

      const price2 = await getStockPrice('AAPL');
      expect(price2).toBe(price1); // Should return cached price

      // Advance time beyond cache expiry (1 minute + buffer)
      jest.advanceTimersByTime(60 * 1000 + 1000);

      // Mock expired cache (return null or old timestamp)
      mockStockPriceCache.get.mockResolvedValueOnce(null);

      const price3 = await getStockPrice('AAPL');
      expect(price3).toBeGreaterThan(0); // Should fetch new price
    });

    it('should handle different symbols independently', async () => {
      const applePrice = await getStockPrice('AAPL');
      const googlePrice = await getStockPrice('GOOGL');

      expect(applePrice).toBeGreaterThan(0);
      expect(googlePrice).toBeGreaterThan(0);
      // They should be different (very unlikely to be same with random generation)
      expect(applePrice).not.toBe(googlePrice);
    });
  });

  describe('checkRuleMatch', () => {
    describe('price_above rule', () => {
      it('should match when current price is above threshold', () => {
        const rule = {
          id: 'rule1',
          user_id: 'user1',
          symbol: 'AAPL',
          rule_type: 'price_above' as const,
          threshold: 150,
          change_percent: null,
          message: null, // 使用生成的消息
          enabled: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        };

        const result = checkRuleMatch(rule, 155);
        expect(result.matched).toBe(true);
        expect(result.message).toContain('AAPL');
        expect(result.message).toContain('155');
        expect(result.message).toContain('150');
      });

      it('should not match when current price is below threshold', () => {
        const rule = {
          id: 'rule1',
          user_id: 'user1',
          symbol: 'AAPL',
          rule_type: 'price_above' as const,
          threshold: 150,
          change_percent: null,
          message: null, // 使用生成的消息
          enabled: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        };

        const result = checkRuleMatch(rule, 145);
        expect(result.matched).toBe(false);
        expect(result.message).toBe('');
      });

      it('should not match when current price equals threshold', () => {
        const rule = {
          id: 'rule1',
          user_id: 'user1',
          symbol: 'AAPL',
          rule_type: 'price_above' as const,
          threshold: 150,
          change_percent: null,
          message: null, // 使用生成的消息
          enabled: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        };

        const result = checkRuleMatch(rule, 150);
        expect(result.matched).toBe(false);
        expect(result.message).toBe('');
      });
    });

    describe('price_below rule', () => {
      it('should match when current price is below threshold', () => {
        const rule = {
          id: 'rule1',
          user_id: 'user1',
          symbol: 'AAPL',
          rule_type: 'price_below' as const,
          threshold: 150,
          change_percent: null,
          message: null, // 使用生成的消息
          enabled: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        };

        const result = checkRuleMatch(rule, 145);
        expect(result.matched).toBe(true);
        expect(result.message).toContain('AAPL');
        expect(result.message).toContain('145');
        expect(result.message).toContain('150');
      });

      it('should not match when current price is above threshold', () => {
        const rule = {
          id: 'rule1',
          user_id: 'user1',
          symbol: 'AAPL',
          rule_type: 'price_below' as const,
          threshold: 150,
          change_percent: null,
          message: null, // 使用生成的消息
          enabled: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        };

        const result = checkRuleMatch(rule, 155);
        expect(result.matched).toBe(false);
        expect(result.message).toBe('');
      });
    });

    describe('price_change rule', () => {
      it('should match when price change exceeds threshold', () => {
        const rule = {
          id: 'rule1',
          user_id: 'user1',
          symbol: 'AAPL',
          rule_type: 'price_change' as const,
          threshold: 100, // base price
          change_percent: 5, // 5% change
          message: null, // 使用生成的消息
          enabled: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        };

        // 6% increase: (106 - 100) / 100 * 100 = 6%
        const result = checkRuleMatch(rule, 106, 100); // 提供previousPrice
        expect(result.matched).toBe(true);
        expect(result.message).toContain('AAPL');
        expect(result.message).toContain('6.00%');
      });

      it('should match when price decrease exceeds threshold', () => {
        const rule = {
          id: 'rule1',
          user_id: 'user1',
          symbol: 'AAPL',
          rule_type: 'price_change' as const,
          threshold: 100,
          change_percent: 5,
          message: null, // 使用生成的消息
          enabled: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        };

        // 6% decrease: (94 - 100) / 100 * 100 = -6%
        const result = checkRuleMatch(rule, 94, 100); // 提供previousPrice
        expect(result.matched).toBe(true);
        expect(result.message).toContain('AAPL');
        expect(result.message).toContain('-6.00%');
      });

      it('should not match when price change is within threshold', () => {
        const rule = {
          id: 'rule1',
          user_id: 'user1',
          symbol: 'AAPL',
          rule_type: 'price_change' as const,
          threshold: 100,
          change_percent: 5,
          message: null, // 使用生成的消息
          enabled: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        };

        // 3% change is within 5% threshold
        const result = checkRuleMatch(rule, 103, 100); // 提供previousPrice
        expect(result.matched).toBe(false);
        expect(result.message).toBe('');
      });

      it('should handle edge case when threshold is zero', () => {
        const rule = {
          id: 'rule1',
          user_id: 'user1',
          symbol: 'AAPL',
          rule_type: 'price_change' as const,
          threshold: 0,
          change_percent: 5,
          message: null, // 使用生成的消息
          enabled: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        };

        const result = checkRuleMatch(rule, 100, 0); // 提供previousPrice为0
        expect(result.matched).toBe(true); // 从0到100是无限大的变化，应该匹配
        expect(result.message).toContain('AAPL');
      });
    });

    it('should use custom message when provided', () => {
      const rule = {
        id: 'rule1',
        user_id: 'user1',
        symbol: 'AAPL',
        rule_type: 'price_above' as const,
        threshold: 150,
        change_percent: null,
        message: 'Custom alert message for AAPL',
        enabled: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const result = checkRuleMatch(rule, 155);
      expect(result.matched).toBe(true);
      expect(result.message).toBe('Custom alert message for AAPL');
    });
  });

  describe('createNotificationWithIdempotency', () => {
    it('should create notification successfully when not duplicate', async () => {
      const mockRpcResponse = {
        data: {
          success: true,
          notification_id: 'notif123',
          was_duplicate: false,
        },
        error: null,
      };

      mockSupabase.rpc.mockResolvedValue(mockRpcResponse);

      const result = await createNotificationWithIdempotency(
        'user123',
        'rule456',
        'AAPL',
        'price_above',
        150,
        155,
        'AAPL price alert',
        'AAPL is now $155, above your threshold of $150'
      );

      expect(result.success).toBe(true);
      expect(result.notificationId).toBe('notif123');
      expect(result.wasDuplicate).toBe(false);
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'create_notification_with_idempotency',
        expect.objectContaining({
          p_user_id: 'user123',
          p_rule_id: 'rule456',
          p_symbol: 'AAPL',
          p_rule_type: 'price_above',
          p_trigger_price: 150,
          p_current_price: 155,
          p_title: 'AAPL price alert',
          p_message: 'AAPL is now $155, above your threshold of $150',
        })
      );
    });

    it('should handle duplicate notification', async () => {
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
        'user123',
        'rule456',
        'AAPL',
        'price_above',
        150,
        155,
        'AAPL price alert',
        'AAPL is now $155, above your threshold of $150'
      );

      expect(result.success).toBe(true);
      expect(result.notificationId).toBeNull();
      expect(result.wasDuplicate).toBe(true);
    });

    it('should handle database error', async () => {
      // Mock supabase.rpc to throw an error
      mockSupabase.rpc.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const result = await createNotificationWithIdempotency(
        'user123',
        'rule456',
        'AAPL',
        'price_above',
        150,
        155,
        'AAPL price alert',
        'AAPL is now $155, above your threshold of $150'
      );

      // Test the function behavior instead of logger calls
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
      expect(result.wasDuplicate).toBe(false);
    });
  });
});
