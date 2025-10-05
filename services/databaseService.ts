// For Render deployment, we'll use standard Redis
import { createClient } from 'redis';

export interface UserSession {
  id: string;
  timestamp: number;
  userAgent: string;
  ip?: string;
  lastActivity: number;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  sessionsToday: number;
  recentSessions: UserSession[];
}

class DatabaseService {
  private readonly SESSION_KEY = 'user_session';
  private readonly STATS_KEY = 'admin_stats';
  private redis: any;

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      // Check if we're on Vercel (has KV env vars) or Render (has REDIS_URL)
      if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        // Vercel KV
        const { kv } = await import('@vercel/kv');
        this.redis = kv;
      } else if (process.env.REDIS_URL) {
        // Standard Redis (Render)
        this.redis = createClient({
          url: process.env.REDIS_URL
        });
        await this.redis.connect();
      } else {
        console.warn('No Redis connection available - using in-memory storage');
        this.redis = new Map(); // Fallback to in-memory storage
      }
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.redis = new Map(); // Fallback to in-memory storage
    }
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Track user session
  async trackUserSession(userAgent: string, ip?: string): Promise<string> {
    const sessionId = this.generateSessionId();
    const session: UserSession = {
      id: sessionId,
      timestamp: Date.now(),
      userAgent,
      ip,
      lastActivity: Date.now()
    };

    try {
      if (this.redis instanceof Map) {
        // In-memory storage
        this.redis.set(`${this.SESSION_KEY}:${sessionId}`, JSON.stringify(session));
        const today = new Date().toISOString().split('T')[0];
        const count = this.redis.get(`daily_sessions:${today}`) || '0';
        this.redis.set(`daily_sessions:${today}`, String(Number(count) + 1));
      } else if (this.redis.setex) {
        // Vercel KV
        await this.redis.setex(`${this.SESSION_KEY}:${sessionId}`, 86400, JSON.stringify(session));
        const today = new Date().toISOString().split('T')[0];
        await this.redis.incr(`daily_sessions:${today}`);
      } else {
        // Standard Redis
        await this.redis.setEx(`${this.SESSION_KEY}:${sessionId}`, 86400, JSON.stringify(session));
        const today = new Date().toISOString().split('T')[0];
        await this.redis.incr(`daily_sessions:${today}`);
      }
    } catch (error) {
      console.error('Error tracking session:', error);
    }
    
    return sessionId;
  }

  // Update user activity
  async updateUserActivity(sessionId: string): Promise<void> {
    try {
      let sessionData;
      
      if (this.redis instanceof Map) {
        sessionData = this.redis.get(`${this.SESSION_KEY}:${sessionId}`);
      } else if (this.redis.get) {
        sessionData = await this.redis.get(`${this.SESSION_KEY}:${sessionId}`);
      }
      
      if (sessionData) {
        const session: UserSession = JSON.parse(sessionData);
        session.lastActivity = Date.now();
        
        if (this.redis instanceof Map) {
          this.redis.set(`${this.SESSION_KEY}:${sessionId}`, JSON.stringify(session));
        } else if (this.redis.setex) {
          await this.redis.setex(`${this.SESSION_KEY}:${sessionId}`, 86400, JSON.stringify(session));
        } else {
          await this.redis.setEx(`${this.SESSION_KEY}:${sessionId}`, 86400, JSON.stringify(session));
        }
      }
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  }

  // Get all active sessions (last 24 hours)
  async getActiveSessions(): Promise<UserSession[]> {
    try {
      let keys;
      
      if (this.redis instanceof Map) {
        keys = Array.from(this.redis.keys()).filter((key: string) => key.startsWith(`${this.SESSION_KEY}:`));
      } else if (this.redis.keys) {
        keys = await this.redis.keys(`${this.SESSION_KEY}:*`);
      } else {
        return [];
      }
      
      const sessions: UserSession[] = [];
      
      for (const key of keys) {
        let sessionData;
        
        if (this.redis instanceof Map) {
          sessionData = this.redis.get(key);
        } else {
          sessionData = await this.redis.get(key);
        }
        
        if (sessionData) {
          sessions.push(JSON.parse(sessionData));
        }
      }
      
      return sessions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting sessions:', error);
      return [];
    }
  }

  // Get admin statistics
  async getAdminStats(): Promise<AdminStats> {
    const sessions = await this.getActiveSessions();
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const today = new Date().toISOString().split('T')[0];
    let sessionsToday = 0;
    
    try {
      if (this.redis instanceof Map) {
        sessionsToday = Number(this.redis.get(`daily_sessions:${today}`) || '0');
      } else if (this.redis.get) {
        sessionsToday = Number(await this.redis.get(`daily_sessions:${today}`) || '0');
      }
    } catch (error) {
      console.error('Error getting daily sessions:', error);
    }
    
    const activeUsers = sessions.filter(s => s.lastActivity > oneHourAgo).length;
    const recentSessions = sessions.slice(0, 10);
    
    return {
      totalUsers: sessions.length,
      activeUsers,
      sessionsToday,
      recentSessions
    };
  }

  // Admin authentication (simple password check)
  async verifyAdminPassword(password: string): Promise<boolean> {
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    return password === adminPassword;
  }
}

export const dbService = new DatabaseService();
