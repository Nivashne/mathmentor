const express = require('express');
const router = express.Router();

// Import the database service
const { dbService } = require('./dist/services/databaseService');

// Track session endpoint
router.post('/track-session', async (req, res) => {
  try {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    const sessionId = await dbService.trackUserSession(userAgent, ip);
    
    res.status(200).json({ sessionId });
  } catch (error) {
    console.error('Session tracking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update activity endpoint
router.post('/update-activity', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID required' });
    }

    await dbService.updateUserActivity(sessionId);
    
    res.status(200).json({ message: 'Activity updated' });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin login endpoint
router.post('/admin/login', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Password required' });
    }

    const isValid = await dbService.verifyAdminPassword(password);
    
    if (isValid) {
      res.status(200).json({ message: 'Login successful' });
    } else {
      res.status(401).json({ message: 'Invalid password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin stats endpoint
router.get('/admin/stats', async (req, res) => {
  try {
    const stats = await dbService.getAdminStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
