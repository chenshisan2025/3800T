import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // 测试logger是否工作
    console.log('Testing logger:', typeof logger);
    console.log('Logger methods:', Object.keys(logger));

    if (logger && typeof logger.info === 'function') {
      logger.info('Logger test successful');
      return NextResponse.json({ success: true, message: 'Logger works' });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Logger is undefined or missing info method',
        loggerType: typeof logger,
        loggerKeys: logger ? Object.keys(logger) : 'logger is null/undefined',
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
