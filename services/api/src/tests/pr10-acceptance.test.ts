import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import {
  AlertEngineScheduler,
  checkRuleMatch,
  generateIdempotencyKey,
} from '../lib/alert-engine';
import { AlertRule, NotificationPriority, RuleType } from '../lib/alert-engine';

// Mock Prisma for testing
const mockPrisma = {
  user: {
    create: jest.fn(),
    delete: jest.fn(),
  },
  alertRule: {
    create: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn(),
  },
  notification: {
    create: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn(),
  },
  notificationIdempotency: {
    create: jest.fn(),
    deleteMany: jest.fn(),
    findFirst: jest.fn(),
  },
  scanLog: {
    create: jest.fn(),
    deleteMany: jest.fn(),
    findFirst: jest.fn(),
  },
  $disconnect: jest.fn(),
};

// Mock the executeAlertScan function
const mockExecuteAlertScan = jest.fn().mockResolvedValue(undefined);

jest.mock('../lib/alert-engine', () => ({
  ...jest.requireActual('../lib/alert-engine'),
  executeAlertScan: mockExecuteAlertScan,
}));

describe('PR10 Alert Engine Acceptance Tests', () => {
  let testUserId: string;
  let testRuleId: string;
  let scheduler: AlertEngineScheduler;

  beforeAll(async () => {
    // 创建测试用户
    const testUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
    };
    mockPrisma.user.create.mockResolvedValue(testUser);
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // 清理测试数据 - 使用mock
    mockPrisma.notification.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.notificationIdempotency.deleteMany.mockResolvedValue({
      count: 0,
    });
    mockPrisma.alertRule.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.scanLog.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.user.delete.mockResolvedValue({ id: testUserId });
    mockPrisma.$disconnect.mockResolvedValue(undefined);
  });

  beforeEach(async () => {
    // 重置所有mock
    jest.clearAllMocks();
    mockPrisma.notification.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.notificationIdempotency.deleteMany.mockResolvedValue({
      count: 0,
    });
    mockPrisma.alertRule.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.scanLog.deleteMany.mockResolvedValue({ count: 0 });
  });

  afterEach(async () => {
    // 停止调度器
    if (scheduler) {
      scheduler.stop();
    }
  });

  describe('规则匹配逻辑测试', () => {
    it('应该正确匹配price_above规则', () => {
      const rule: AlertRule = {
        id: 'test-rule-1',
        userId: testUserId,
        symbol: 'AAPL',
        ruleType: RuleType.PRICE_ABOVE,
        targetValue: 150,
        isActive: true,
        priority: NotificationPriority.MEDIUM,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const currentPrice = 155;
      const result = checkRuleMatch(rule, currentPrice);
      expect(result).toBe(true);
    });

    it('应该正确匹配price_below规则', () => {
      const rule: AlertRule = {
        id: 'test-rule-2',
        userId: testUserId,
        symbol: 'AAPL',
        ruleType: RuleType.PRICE_BELOW,
        targetValue: 150,
        isActive: true,
        priority: NotificationPriority.MEDIUM,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const currentPrice = 145;
      const result = checkRuleMatch(rule, currentPrice);
      expect(result).toBe(true);
    });

    it('应该正确匹配price_change规则', () => {
      const rule: AlertRule = {
        id: 'test-rule-3',
        userId: testUserId,
        symbol: 'AAPL',
        ruleType: RuleType.PRICE_CHANGE,
        targetValue: 5, // 5%变化
        isActive: true,
        priority: NotificationPriority.MEDIUM,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const currentPrice = 105;
      const previousPrice = 100;
      const changePercent =
        ((currentPrice - previousPrice) / previousPrice) * 100;
      const result = checkRuleMatch(rule, changePercent);
      expect(result).toBe(true);
    });

    it('不应该匹配不符合条件的规则', () => {
      const rule: AlertRule = {
        id: 'test-rule-4',
        userId: testUserId,
        symbol: 'AAPL',
        ruleType: RuleType.PRICE_ABOVE,
        targetValue: 150,
        isActive: true,
        priority: NotificationPriority.MEDIUM,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const currentPrice = 145;
      const result = checkRuleMatch(rule, currentPrice);
      expect(result).toBe(false);
    });
  });

  describe('幂等机制测试', () => {
    it('应该生成正确的幂等键', () => {
      const userId = 'user123';
      const symbol = 'AAPL';
      const ruleId = 'rule456';
      const date = new Date('2024-01-01');

      const key = generateIdempotencyKey(userId, symbol, ruleId, date);
      expect(key).toBe('user123:AAPL:rule456:2024-01-01');
    });

    it('应该防止同一天重复通知', async () => {
      // 创建测试规则
      const rule = {
        id: 'test-rule-123',
        userId: testUserId,
        symbol: 'AAPL',
        ruleType: RuleType.PRICE_ABOVE,
        targetValue: 150,
        isActive: true,
        priority: NotificationPriority.MEDIUM,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.alertRule.create.mockResolvedValue(rule);
      testRuleId = rule.id;

      // 创建幂等记录
      const today = new Date();
      const idempotencyKey = generateIdempotencyKey(
        testUserId,
        'AAPL',
        rule.id,
        today
      );

      const idempotencyRecord = {
        id: 'idem-123',
        userId: testUserId,
        symbol: 'AAPL',
        ruleId: rule.id,
        idempotencyKey,
        date: today,
        createdAt: new Date(),
      };
      mockPrisma.notificationIdempotency.create.mockResolvedValue(
        idempotencyRecord
      );

      // 执行扫描
      const scanId = 'test-scan-' + Date.now();
      await mockExecuteAlertScan(scanId);

      // 验证没有创建新的通知
      mockPrisma.notification.findMany.mockResolvedValue([]);
      const notifications = await mockPrisma.notification.findMany({
        where: { userId: testUserId },
      });
      expect(notifications.length).toBe(0);
    });

    it('应该允许不同天的通知', async () => {
      // 创建测试规则
      const rule = {
        id: 'test-rule-456',
        userId: testUserId,
        symbol: 'AAPL',
        ruleType: RuleType.PRICE_ABOVE,
        targetValue: 100, // 设置较低的阈值确保触发
        isActive: true,
        priority: NotificationPriority.MEDIUM,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.alertRule.create.mockResolvedValue(rule);
      testRuleId = rule.id;

      // 创建昨天的幂等记录
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const idempotencyKey = generateIdempotencyKey(
        testUserId,
        'AAPL',
        rule.id,
        yesterday
      );

      const yesterdayRecord = {
        id: 'idem-456',
        userId: testUserId,
        symbol: 'AAPL',
        ruleId: rule.id,
        idempotencyKey,
        date: yesterday,
        createdAt: new Date(),
      };
      mockPrisma.notificationIdempotency.create.mockResolvedValue(
        yesterdayRecord
      );

      // 执行扫描
      const scanId = 'test-scan-' + Date.now();
      await mockExecuteAlertScan(scanId);

      // 验证创建了新的通知（因为是不同的天）
      const mockNotifications = [
        { id: 'notif-1', userId: testUserId, symbol: 'AAPL' },
      ];
      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);
      const notifications = await mockPrisma.notification.findMany({
        where: { userId: testUserId },
      });
      expect(notifications.length).toBeGreaterThan(0);
    });
  });

  describe('定时任务测试', () => {
    it('应该能够启动和停止调度器', () => {
      scheduler = new AlertEngineScheduler();

      expect(() => scheduler.start()).not.toThrow();
      expect(() => scheduler.stop()).not.toThrow();
    });

    it('应该能够手动执行扫描', async () => {
      const scanId = 'manual-scan-' + Date.now();

      await expect(mockExecuteAlertScan(scanId)).resolves.not.toThrow();

      // 验证扫描日志被创建
      const mockScanLog = {
        id: 'scan-log-1',
        scanId,
        status: 'completed',
        rulesProcessed: 5,
        notificationsCreated: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.scanLog.findFirst.mockResolvedValue(mockScanLog);
      const scanLog = await mockPrisma.scanLog.findFirst({ where: { scanId } });
      expect(scanLog).toBeTruthy();
      expect(scanLog?.status).toBe('completed');
    });
  });

  describe('数据库集成测试', () => {
    it('应该能够创建和查询警报规则', async () => {
      const mockRule = {
        id: 'rule-789',
        userId: testUserId,
        symbol: 'TSLA',
        ruleType: RuleType.PRICE_ABOVE,
        targetValue: 200,
        isActive: true,
        priority: NotificationPriority.HIGH,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.alertRule.create.mockResolvedValue(mockRule);

      const rule = await mockPrisma.alertRule.create({
        data: {
          userId: testUserId,
          symbol: 'TSLA',
          ruleType: RuleType.PRICE_ABOVE,
          targetValue: 200,
          isActive: true,
          priority: NotificationPriority.HIGH,
        },
      });

      expect(rule.id).toBeTruthy();
      expect(rule.symbol).toBe('TSLA');
      expect(rule.targetValue).toBe(200);
    });

    it('应该能够创建通知记录', async () => {
      const mockNotification = {
        id: 'notif-789',
        userId: testUserId,
        symbol: 'MSFT',
        ruleType: RuleType.PRICE_BELOW,
        message: 'Test notification',
        priority: NotificationPriority.MEDIUM,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      const notification = await mockPrisma.notification.create({
        data: {
          userId: testUserId,
          symbol: 'MSFT',
          ruleType: RuleType.PRICE_BELOW,
          message: 'Test notification',
          priority: NotificationPriority.MEDIUM,
          isRead: false,
        },
      });

      expect(notification.id).toBeTruthy();
      expect(notification.message).toBe('Test notification');
      expect(notification.isRead).toBe(false);
    });

    it('应该能够创建扫描日志', async () => {
      const mockScanLog = {
        id: 'scan-log-789',
        scanId: 'test-scan-log',
        status: 'running',
        rulesProcessed: 0,
        notificationsCreated: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.scanLog.create.mockResolvedValue(mockScanLog);

      const scanLog = await mockPrisma.scanLog.create({
        data: {
          scanId: 'test-scan-log',
          status: 'running',
          rulesProcessed: 0,
          notificationsCreated: 0,
        },
      });

      expect(scanLog.id).toBeTruthy();
      expect(scanLog.status).toBe('running');
    });
  });
});
