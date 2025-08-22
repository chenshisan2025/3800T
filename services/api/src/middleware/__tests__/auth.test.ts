import { requireUser, featureGate } from '../auth';
import { NextRequest } from 'next/server';
import { verifyJWT } from '@/utils';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/utils', () => ({
  verifyJWT: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

const mockVerifyJWT = verifyJWT as jest.MockedFunction<typeof verifyJWT>;
const mockPrismaUserFindUnique = prisma.user.findUnique as jest.MockedFunction<
  typeof prisma.user.findUnique
>;

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requireUser', () => {
    it('should return error when no authorization header', async () => {
      const request = new NextRequest('http://localhost/api/test');

      const result = await requireUser(request);

      expect(result.success).toBe(false);
      expect(result.response.status).toBe(401);
    });

    it('should return error when invalid authorization format', async () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { authorization: 'InvalidFormat token' },
      });

      const result = await requireUser(request);

      expect(result.success).toBe(false);
      expect(result.response.status).toBe(401);
    });

    it('should return error when JWT verification fails', async () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { authorization: 'Bearer invalid-token' },
      });

      mockVerifyJWT.mockResolvedValue({ valid: false, error: 'Invalid token' });

      const result = await requireUser(request);

      expect(result.success).toBe(false);
      expect(result.response.status).toBe(401);
    });

    it('should return error when user not found in database', async () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { authorization: 'Bearer valid-token' },
      });

      mockVerifyJWT.mockResolvedValue({
        valid: true,
        payload: { sub: 'user-id', email: 'test@example.com' },
      });
      mockPrismaUserFindUnique.mockResolvedValue(null);

      const result = await requireUser(request);

      expect(result.success).toBe(false);
      expect(result.response.status).toBe(401);
    });

    it('should return user when authentication succeeds', async () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { authorization: 'Bearer valid-token' },
      });

      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        subscriptionPlan: 'free',
      };

      mockVerifyJWT.mockResolvedValue({
        valid: true,
        payload: { sub: 'user-id', email: 'test@example.com' },
      });
      mockPrismaUserFindUnique.mockResolvedValue(mockUser as any);

      const result = await requireUser(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toEqual(mockUser);
      }
    });
  });

  describe('featureGate', () => {
    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      subscriptionPlan: 'free' as const,
    };

    it('should allow free features for free users', async () => {
      const result = await featureGate(mockUser, 'free', 'request-id');

      expect(result).toBeNull();
    });

    it('should deny pro features for free users', async () => {
      const result = await featureGate(mockUser, 'pro', 'request-id');

      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should allow pro features for pro users', async () => {
      const proUser = { ...mockUser, subscriptionPlan: 'pro' as const };
      const result = await featureGate(proUser, 'pro', 'request-id');

      expect(result).toBeNull();
    });

    it('should allow all features for enterprise users', async () => {
      const enterpriseUser = {
        ...mockUser,
        subscriptionPlan: 'enterprise' as const,
      };

      const freeResult = await featureGate(
        enterpriseUser,
        'free',
        'request-id'
      );
      const proResult = await featureGate(enterpriseUser, 'pro', 'request-id');
      const enterpriseResult = await featureGate(
        enterpriseUser,
        'enterprise',
        'request-id'
      );

      expect(freeResult).toBeNull();
      expect(proResult).toBeNull();
      expect(enterpriseResult).toBeNull();
    });
  });
});
