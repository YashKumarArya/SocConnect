import bcrypt from "bcryptjs";
import type { RequestHandler, Request } from "express";
import session from "express-session";
import { storage } from "./storage";
import type { User } from "@shared/schema";

// Session interface for TypeScript
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    user?: User;
  }
}

export interface AuthRequest extends Request {
  session: session.Session & Partial<session.SessionData> & {
    userId?: string;
    user?: User;
  };
}

export class AuthService {
  // Hash password using bcrypt
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Verify password against hash
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Register new user
  static async registerUser(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: 'analyst' | 'admin';
  }) {
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(userData.password);

    // Create user
    const user = await storage.createUser({
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || 'analyst',
    });

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Login user
  static async loginUser(email: string, password: string) {
    // Get user with password for verification
    const userWithPassword = await storage.getUserByEmailWithPassword(email);
    if (!userWithPassword) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, userWithPassword.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Return user without password
    const { password: _, ...user } = userWithPassword;
    return user;
  }

  // Get current user from session
  static async getCurrentUser(req: AuthRequest): Promise<User | null> {
    if (!req.session.userId) {
      return null;
    }

    const user = await storage.getUser(req.session.userId);
    return user || null;
  }
}

// Authentication middleware
export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.userId = undefined;
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Optional authentication middleware (doesn't require auth but adds user if available)
export const optionalAuth: RequestHandler = async (req: any, res, next) => {
  try {
    if (req.session.userId) {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};

// Role-based authentication middleware
export const requireRole = (role: 'analyst' | 'admin'): RequestHandler => {
  return async (req: any, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (req.user.role !== role && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
      }

      next();
    } catch (error) {
      console.error('Role authorization error:', error);
      res.status(403).json({ message: "Forbidden" });
    }
  };
};