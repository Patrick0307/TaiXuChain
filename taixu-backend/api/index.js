// Vercel Serverless Function Entry Point
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sponsorCreatePlayer, getPlayerByAddress } from '../services/sponsorService.js';

dotenv.config();

const app = express();

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

// 获取 LingStone 余额
app.get('/api/lingstone/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({ 
        error: 'Missing wallet address' 
      });
    }

    console.log(`[Query] Getting LingStone balance for: ${address}`);

    const { getLingStoneBalance } = await import('../services/sponsorService.js');
    const balance = await getLingStoneBalance(address);

    res.json({ 
      balance,
      address
    });
  } catch (error) {
    console.error('[Query] Error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.toString()
    });
  }
});

// 获取 LingStone coin 对象
app.get('/api/lingstone/coins/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({ 
        error: 'Missing wallet address' 
      });
    }

    console.log(`[Query] Getting LingStone coins for: ${address}`);

    const { getLingStoneCoins } = await import('../services/sponsorService.js');
    const coins = await getLingStoneCoins(address);

    res.json({ 
      coins,
      address
    });
  } catch (error) {
    console.error('[Query] Error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.toString()
    });
  }
});

// 赞助铸造 LingStone
app.post('/api/sponsor/mint-lingstone', async (req, res) => {
  try {
    const { playerAddress } = req.body;

    if (!playerAddress) {
      return res.status(400).json({ 
        error: 'Missing required field: playerAddress' 
      });
    }

    console.log(`[Sponsor] Minting LingStone for ${playerAddress}`);

    const { sponsorMintLingStone } = await import('../services/sponsorService.js');
    const result = await sponsorMintLingStone(playerAddress);

    res.json({ 
      success: true, 
      result,
      message: 'LingStone minted successfully with sponsored gas'
    });
  } catch (error) {
    console.error('[Sponsor] Error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.toString()
    });
  }
});

// 赞助销毁武器（玩家丢弃武器）
app.post('/api/sponsor/burn-weapon', async (req, res) => {
  try {
    const { weaponObjectId } = req.body;

    if (!weaponObjectId) {
      return res.status(400).json({ 
        error: 'Missing required field: weaponObjectId' 
      });
    }

    console.log(`[Sponsor] Burning weapon: ${weaponObjectId}`);

    const { sponsorBurnWeapon } = await import('../services/sponsorService.js');
    const result = await sponsorBurnWeapon(weaponObjectId);

    res.json({ 
      success: true, 
      result,
      message: 'Weapon burned successfully with sponsored gas'
    });
  } catch (error) {
    console.error('[Sponsor] Error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.toString()
    });
  }
});

// 赞助合成武器（铸造升级后的武器）
app.post('/api/sponsor/merge-weapon', async (req, res) => {
  try {
    const { playerAddress, weaponType, rarity, newLevel } = req.body;

    if (!playerAddress || !weaponType || !rarity || !newLevel) {
      return res.status(400).json({ 
        error: 'Missing required fields: playerAddress, weaponType, rarity, newLevel' 
      });
    }

    console.log(`[Sponsor] Merging weapons for ${playerAddress}`);
    console.log(`  Type: ${weaponType}, Rarity: ${rarity}, New Level: ${newLevel}`);

    const { sponsorMergeWeapon } = await import('../services/sponsorService.js');
    const result = await sponsorMergeWeapon(playerAddress, weaponType, rarity, newLevel);

    res.json({ 
      success: true, 
      result,
      message: 'Weapon merged successfully with sponsored gas'
    });
  } catch (error) {
    console.error('[Sponsor] Error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.toString()
    });
  }
});

// ========== 市场 API ==========

// 获取所有市场挂单
app.get('/api/marketplace/listings', async (req, res) => {
  try {
    console.log('[Query] Getting all marketplace listings');

    const { getAllMarketplaceListings } = await import('../services/sponsorService.js');
    const listings = await getAllMarketplaceListings();

    res.json({ 
      success: true,
      listings,
      count: listings.length
    });
  } catch (error) {
    console.error('[Query] Error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.toString()
    });
  }
});

// 获取单个挂单详情
app.get('/api/marketplace/listing/:weaponId', async (req, res) => {
  try {
    const { weaponId } = req.params;

    if (!weaponId) {
      return res.status(400).json({ 
        error: 'Missing weapon ID' 
      });
    }

    console.log(`[Query] Getting listing for weapon: ${weaponId}`);

    const { getMarketplaceListing } = await import('../services/sponsorService.js');
    const listing = await getMarketplaceListing(weaponId);

    if (!listing) {
      return res.status(404).json({ 
        error: 'Listing not found' 
      });
    }

    res.json({ 
      success: true,
      listing
    });
  } catch (error) {
    console.error('[Query] Error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.toString()
    });
  }
});

export default app;
