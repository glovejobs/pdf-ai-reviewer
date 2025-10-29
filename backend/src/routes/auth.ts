import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { authMiddleware } from '../middleware/auth.middleware';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'Google ID token is required'),
});

export default async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/auth/register
   * Register a new user with email/password
   */
  fastify.post('/register', async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body);

      const result = await AuthService.register(body);

      return reply.status(201).send({
        success: true,
        data: result,
        message: 'User registered successfully',
      });
    } catch (error: any) {
      fastify.log.error(error, 'Registration error');

      // Handle validation errors
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      // Handle duplicate email
      if (error.message.includes('already exists')) {
        return reply.status(409).send({
          error: 'Conflict',
          message: error.message,
        });
      }

      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Registration failed',
      });
    }
  });

  /**
   * POST /api/auth/login
   * Login with email/password
   */
  fastify.post('/login', async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);

      const result = await AuthService.login(body);

      return reply.send({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error: any) {
      fastify.log.error(error, 'Login error');

      // Handle validation errors
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      // Handle invalid credentials
      if (
        error.message.includes('Invalid email or password') ||
        error.message.includes('disabled')
      ) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: error.message,
        });
      }

      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Login failed',
      });
    }
  });

  /**
   * POST /api/auth/google
   * Google OAuth authentication
   */
  fastify.post('/google', async (request, reply) => {
    try {
      const body = googleAuthSchema.parse(request.body);

      const result = await AuthService.googleAuth(body.idToken);

      return reply.send({
        success: true,
        data: result,
        message: 'Google authentication successful',
      });
    } catch (error: any) {
      fastify.log.error(error, 'Google auth error');

      // Handle validation errors
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      // Handle authentication failures
      if (
        error.message.includes('Google authentication failed') ||
        error.message.includes('Invalid Google token')
      ) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: error.message,
        });
      }

      // Handle disabled accounts
      if (error.message.includes('disabled')) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: error.message,
        });
      }

      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Google authentication failed',
      });
    }
  });

  /**
   * GET /api/auth/me
   * Get current user (requires authentication)
   */
  fastify.get(
    '/me',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'User not authenticated',
          });
        }

        const user = await AuthService.getUserById(request.user.userId);

        return reply.send({
          success: true,
          data: user,
        });
      } catch (error: any) {
        fastify.log.error(error, 'Get user error');

        if (error.message.includes('not found')) {
          return reply.status(404).send({
            error: 'Not found',
            message: 'User not found',
          });
        }

        return reply.status(500).send({
          error: 'Internal server error',
          message: 'Failed to get user',
        });
      }
    }
  );

  /**
   * POST /api/auth/logout
   * Logout (mainly for audit logging)
   */
  fastify.post(
    '/logout',
    { preHandler: authMiddleware },
    async (request, reply) => {
      try {
        // For JWT-based auth, logout is handled client-side by removing the token
        // This endpoint is mainly for audit logging

        if (request.user) {
          // You could add audit log here if needed
          // await prisma.auditLog.create({ ... })
        }

        return reply.send({
          success: true,
          message: 'Logout successful',
        });
      } catch (error: any) {
        fastify.log.error(error, 'Logout error');

        return reply.status(500).send({
          error: 'Internal server error',
          message: 'Logout failed',
        });
      }
    }
  );
}
