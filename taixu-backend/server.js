import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sponsorCreatePlayer, getPlayerByAddress, getPlayerWeapon, getAllPlayerWeapons, sponsorMintWeapon, sponsorMintRandomWeapon, getWeaponById } from './services/sponsorService.js';

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

// 查询玩家是否已有角色
app.get('/api/player/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({ 
        error: 'Missing player address' 
      });
    }

    console.log(`[Query] Checking player for address: ${address}`);

    const player = await getPlayerByAddress(address);

    if (!player) {
      return res.json({ 
        exists: false,
        player: null
      });
    }

    res.json({ 
      exists: true,
      player
    });
  } catch (error) {
    console.error('[Query] Error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.toString()
    });
  }
});

// 赞助创建角色交易
app.post('/api/sponsor/create-player', async (req, res) => {
  try {
    const { playerAddress, name, classId, customization } = req.body;

    if (!playerAddress || !name || !classId) {
      return res.status(400).json({ 
        error: 'Missing required fields: playerAddress, name, classId' 
      });
    }

    console.log(`[Sponsor] Creating player for ${playerAddress}, name: ${name}, class: ${classId}`);
    if (customization) {
      console.log(`[Sponsor] Customization:`, customization);
    }

    const result = await sponsorCreatePlayer(playerAddress, name, classId, customization || {});

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

// 查询玩家武器（可选：根据职业过滤）
app.get('/api/weapon/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { classId } = req.query; // 可选的职业 ID 查询参数

    if (!address) {
      return res.status(400).json({ 
        error: 'Missing player address' 
      });
    }

    const classIdNum = classId ? parseInt(classId) : null;
    console.log(`[Query] Checking weapon for address: ${address}${classIdNum ? `, class: ${classIdNum}` : ''}`);

    const weapon = await getPlayerWeapon(address, classIdNum);

    if (!weapon) {
      return res.json({ 
        exists: false,
        weapon: null
      });
    }

    res.json({ 
      exists: true,
      weapon
    });
  } catch (error) {
    console.error('[Query] Error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.toString()
    });
  }
});

// 查询玩家所有武器
app.get('/api/weapons/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({ 
        error: 'Missing player address' 
      });
    }

    console.log(`[Query] Getting all weapons for address: ${address}`);

    const weapons = await getAllPlayerWeapons(address);

    res.json({ 
      success: true,
      count: weapons.length,
      weapons
    });
  } catch (error) {
    console.error('[Query] Error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.toString()
    });
  }
});

// 通过 objectId 查询武器
app.get('/api/weapon-by-id/:objectId', async (req, res) => {
  try {
    const { objectId } = req.params;

    if (!objectId) {
      return res.status(400).json({ 
        error: 'Missing weapon objectId' 
      });
    }

    console.log(`[Query] Getting weapon by ID: ${objectId}`);

    const weapon = await getWeaponById(objectId);

    if (!weapon) {
      return res.json({ 
        exists: false,
        weapon: null
      });
    }

    res.json({ 
      exists: true,
      weapon
    });
  } catch (error) {
    console.error('[Query] Error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.toString()
    });
  }
});

// 赞助铸造武器
app.post('/api/sponsor/mint-weapon', async (req, res) => {
  try {
    const { playerAddress, classId } = req.body;

    if (!playerAddress || !classId) {
      return res.status(400).json({ 
        error: 'Missing required fields: playerAddress, classId' 
      });
    }

    console.log(`[Sponsor] Minting weapon for ${playerAddress}, class: ${classId}`);

    const result = await sponsorMintWeapon(playerAddress, classId);

    res.json({ 
      success: true, 
      result,
      message: 'Weapon minted successfully with sponsored gas'
    });
  } catch (error) {
    console.error('[Sponsor] Error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.toString()
    });
  }
});

// 赞助铸造随机武器（怪物掉落）
app.post('/api/sponsor/mint-random-weapon', async (req, res) => {
  try {
    const { playerAddress } = req.body;

    if (!playerAddress) {
      return res.status(400).json({ 
        error: 'Missing required field: playerAddress' 
      });
    }

    console.log(`[Sponsor] Minting RANDOM weapon for ${playerAddress}`);

    const { result, weaponInfo } = await sponsorMintRandomWeapon(playerAddress);

    res.json({ 
      success: true, 
      result,
      weaponInfo,
      message: 'Random weapon minted successfully with sponsored gas'
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
