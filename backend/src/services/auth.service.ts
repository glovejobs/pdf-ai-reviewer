import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days
const SALT_ROUNDS = 10;

interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  /**
   * Register a new user with email/password
   */
  static async register({ email, password, name }: RegisterInput) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role: UserRole.USER, // Default role
        emailVerified: false, // Require email verification
      },
    });

    // Generate JWT token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        action: 'LOGIN',
        userId: user.id,
        metadata: { method: 'email_registration' },
      },
    });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Login with email/password
   */
  static async login({ email, password }: LoginInput) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.password) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is disabled');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        action: 'LOGIN',
        userId: user.id,
        metadata: { method: 'email_password' },
      },
    });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Google OAuth login/register
   */
  static async googleAuth(idToken: string) {
    try {
      // Verify Google token
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new Error('Invalid Google token');
      }

      const { email, name, picture, sub: googleId } = payload;

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (user) {
        // Update Google ID if not set
        if (!user.googleId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              googleId,
              avatarUrl: picture,
              emailVerified: true, // Google emails are verified
              lastLoginAt: new Date(),
            },
          });
        } else {
          // Just update last login
          user = await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });
        }
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            name: name || email.split('@')[0],
            googleId,
            avatarUrl: picture,
            emailVerified: true,
            role: UserRole.USER,
          },
        });
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is disabled');
      }

      // Generate JWT token
      const token = this.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Log audit event
      await prisma.auditLog.create({
        data: {
          action: 'LOGIN',
          userId: user.id,
          metadata: { method: 'google_oauth' },
        },
      });

      return {
        user: this.sanitizeUser(user),
        token,
      };
    } catch (error) {
      throw new Error('Google authentication failed');
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Verify JWT token and return payload
   */
  static verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Generate JWT token
   */
  private static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  /**
   * Remove sensitive fields from user object
   */
  private static sanitizeUser(user: any) {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Check if user is admin
   */
  static isAdmin(role: UserRole): boolean {
    return role === UserRole.ADMIN;
  }
}
