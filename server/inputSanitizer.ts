import type { RequestHandler } from "express";

/**
 * Input sanitization middleware for security
 * Protects against XSS, SQL injection, and other security threats
 */

// HTML sanitization - remove script tags and dangerous attributes
export const sanitizeHTML = (input: string): string => {
  if (typeof input !== 'string') return input;
  
  return input
    // Remove script tags completely
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script[^>]*>/gi, '')
    // Remove dangerous event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: URLs
    .replace(/javascript:/gi, '')
    // Remove potentially dangerous HTML tags
    .replace(/<(iframe|object|embed|form|input|meta|link)[^>]*>/gi, '')
    // Encode remaining angle brackets for safety
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

// SQL injection prevention - escape dangerous SQL characters
export const sanitizeSQL = (input: string): string => {
  if (typeof input !== 'string') return input;
  
  return input
    // Escape single quotes
    .replace(/'/g, "''")
    // Remove or escape dangerous SQL keywords
    .replace(/;\s*(DROP|DELETE|INSERT|UPDATE|EXEC|UNION|SELECT)\s+/gi, '; -- $1 ')
    // Remove SQL comments
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
};

// Deep sanitization for objects
const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeHTML(sanitizeSQL(obj));
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Express middleware to sanitize request body, query, and params
 */
export const inputSanitizer: RequestHandler = (req, res, next) => {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }
    
    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    console.error('Input sanitization error:', error);
    res.status(400).json({ error: 'Invalid input data' });
  }
};

/**
 * Rate limiting helper for additional security
 */
export class SimpleRateLimit {
  private requests = new Map<string, { count: number; resetTime: number }>();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  check(identifier: string): boolean {
    const now = Date.now();
    const key = `${identifier}`;
    
    // Clean old entries
    if (this.requests.size > 10000) {
      const entries = Array.from(this.requests.entries());
      for (const [k, v] of entries) {
        if (now > v.resetTime) {
          this.requests.delete(k);
        }
      }
    }
    
    const record = this.requests.get(key);
    
    if (!record || now > record.resetTime) {
      this.requests.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }
    
    if (record.count >= this.maxRequests) {
      return false;
    }
    
    record.count++;
    return true;
  }
}

export const rateLimiter = new SimpleRateLimit();

export const rateLimitMiddleware: RequestHandler = (req, res, next) => {
  const identifier = req.ip || req.socket.remoteAddress || 'unknown';
  
  if (!rateLimiter.check(identifier)) {
    return res.status(429).json({ 
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.'
    });
  }
  
  next();
};