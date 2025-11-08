import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sponsorCreatePlayer } from './services/sponsorService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Taixu Backend is running' });
});

// 赞助创建角色交易
app.post('/api/sponsor/create-player', async (req, res) => {
  try {
    const { playerAddress, name, classId } = req.body;

    if (!playerAddress || !name || !classId) {
      return res.status(400).json({ 
        error: 'Missing required fields: playerAddress, name, classId' 
      });
    }

    console.log(`[Sponsor] Creating player for ${playerAddress}, name: ${name}, class: ${classId}`);

    const result = await sponsorCreatePlayer(playerAddress, name, classId);

    res.json({ 
      success: true, 
      result,
      message: 'Player created successfully with sponsored gas'
    });
  } catch (error) {
    console.error('[Sponsor] Error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.toString()
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Taixu Backend running on http://localhost:${PORT}`);
  console.log(`📝 Sponsor wallet will pay gas for all player transactions`);
});
