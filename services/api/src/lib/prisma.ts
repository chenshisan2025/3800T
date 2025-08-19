import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 数据库连接健康检查
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  }
}

// 优雅关闭数据库连接
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('关闭数据库连接时出错:', error);
  }
}

// 进程退出时自动关闭连接 - Edge Runtime兼容版本
if (typeof process !== 'undefined' && process.on) {
  process.on('beforeExit', async () => {
    await disconnectDatabase();
  });

  process.on('SIGINT', async () => {
    await disconnectDatabase();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}