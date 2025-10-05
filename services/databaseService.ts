import { kv } from '@vercel/kv';

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

    // Store session with 24-hour expiration
    await kv.setex(`${this.SESSION_KEY}:${sessionId}`, 86400, JSON.stringify(session));
    
    // Update daily counter
    const today = new Date().toISOString().split('T')[0];
    await kv.incr(`daily_sessions:${today}`);
    
    return sessionId;
  }

  // Update user activity
  async updateUserActivity(sessionId: string): Promise<void> {
    const sessionData = await kv.get(`${this.SESSION_KEY}:${sessionId}`);
    if (sessionData) {
      const session: UserSession = JSON.parse(sessionData as string);
      session.lastActivity = Date.now();
      await kv.setex(`${this.SESSION_KEY}:${sessionId}`, 86400, JSON.stringify(session));
    }
  }

  // Get all active sessions (last 24 hours)
  async getActiveSessions(): Promise<UserSession[]> {
    const keys = await kv.keys(`${this.SESSION_KEY}:*`);
    const sessions: UserSession[] = [];
    
    for (const key of keys) {
      const sessionData = await kv.get(key);
      if (sessionData) {
        sessions.push(JSON.parse(sessionData as string));
      }
    }
    
    return sessions.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get admin statistics
  async getAdminStats(): Promise<AdminStats> {
    const sessions = await this.getActiveSessions();
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const today = new Date().toISOString().split('T')[0];
    const sessionsToday = await kv.get(`daily_sessions:${today}`) || 0;
    
    const activeUsers = sessions.filter(s => s.lastActivity > oneHourAgo).length;
    const recentSessions = sessions.slice(0, 10);
    
    return {
      totalUsers: sessions.length,
      activeUsers,
      sessionsToday: Number(sessionsToday),
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
