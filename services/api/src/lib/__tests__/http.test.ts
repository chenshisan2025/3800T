import { ok, fail, ErrorCodes } from '../http';
import { NextResponse } from 'next/server';

describe('HTTP Response Utilities', () => {
  describe('ok() function', () => {
    it('should return success response with data', () => {
      const data = { test: 'value' };
      const message = 'Success';
      const requestId = 'test-request-id';

      const response = ok(data, message, requestId);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
      expect(response.headers.get('x-request-id')).toBe(requestId);

      // Test response body
      const responseData = JSON.parse(response.body as any);
      expect(responseData).toEqual({
        ok: true,
        data,
        message,
        traceId: requestId,
      });
    });

    it('should work without message', () => {
      const data = { test: 'value' };
      const requestId = 'test-request-id';

      const response = ok(data, undefined, requestId);
      const responseData = JSON.parse(response.body as any);

      expect(responseData.message).toBeUndefined();
    });
  });

  describe('fail() function', () => {
    it('should return error response', () => {
      const error = {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Validation failed',
      };
      const requestId = 'test-request-id';

      const response = fail(error, requestId, 400);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(400);
      expect(response.headers.get('x-request-id')).toBe(requestId);

      const responseData = JSON.parse(response.body as any);
      expect(responseData).toEqual({
        ok: false,
        error: {
          ...error,
          traceId: requestId,
        },
      });
    });

    it('should default to 500 status', () => {
      const error = {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Internal error',
      };
      const requestId = 'test-request-id';

      const response = fail(error, requestId);
      expect(response.status).toBe(500);
    });
  });

  describe('ErrorCodes', () => {
    it('should have all required error codes', () => {
      expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ErrorCodes.FORBIDDEN).toBe('FORBIDDEN');
      expect(ErrorCodes.NOT_FOUND).toBe('NOT_FOUND');
      expect(ErrorCodes.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
      expect(ErrorCodes.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    });
  });
});
