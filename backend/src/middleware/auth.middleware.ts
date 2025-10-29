import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';
import { UserRole } from '@prisma/client';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
      role: UserRole;
    };
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = AuthService.verifyToken(token);

    // Attach user to request
    request.user = payload;
  } catch (error: any) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: error.message || 'Invalid token',
    });
  }
}

/**
 * Admin-only middleware
 * Requires authentication and ADMIN role
 */
export async function adminMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // First verify authentication
  await authMiddleware(request, reply);

  // Check if user is admin
  if (!request.user || request.user.role !== UserRole.ADMIN) {
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'Admin access required',
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't require it
 */
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = AuthService.verifyToken(token);
      request.user = payload;
    }
  } catch (error) {
    // Silently fail for optional auth
    // User will be undefined in request
  }
}
