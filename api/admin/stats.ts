import { dbService } from '../../services/databaseService';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // In a real app, you'd verify admin authentication here
    // For simplicity, we'll skip that for now
    
    const stats = await dbService.getAdminStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
