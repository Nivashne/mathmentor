import { dbService } from '../../services/databaseService';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    const sessionId = await dbService.trackUserSession(userAgent, ip);
    
    res.status(200).json({ sessionId });
  } catch (error) {
    console.error('Session tracking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
