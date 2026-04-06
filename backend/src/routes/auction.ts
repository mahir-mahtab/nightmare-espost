// ============================================================================
// Auction Routes
// ============================================================================

import { Router, Request, Response } from 'express';
import { queryOne, queryAll } from '../utils/db.js';
import { requireAuth } from '../middleware/auth.js';
import { logger } from '../services/logger.js';
import type { AuctionState, AuctionStateResponse, Bid, Player, Team, PlayerResponse, TeamResponse } from '../types/index.js';

const router = Router({ mergeParams: true });

/**
 * GET /api/events/:eventId/auction/state
 * Get current auction state
 */
router.get('/state', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const state = await queryOne<AuctionState>(
      'SELECT * FROM auction_state WHERE event_id = $1',
      [eventId]
    );

    if (!state) {
      return res.status(404).json({
        success: false,
        error: 'Auction state not found',
      });
    }

    // Build response with player and bidder details
    let currentPlayer: PlayerResponse | null = null;
    let currentBidder: TeamResponse | null = null;

    if (state.current_player_id) {
      currentPlayer = await queryOne<PlayerResponse>(
        'SELECT * FROM players WHERE id = $1',
        [state.current_player_id]
      );
    }

    if (state.current_bidder_id) {
      currentBidder = await queryOne<TeamResponse>(
        'SELECT id, event_id, name, owner_name, owner_avatar_url, purse, coins_left FROM teams WHERE id = $1',
        [state.current_bidder_id]
      );
    }

    // Calculate time remaining
    let timeRemaining: number | undefined;
    if (state.is_active && state.start_time) {
      const elapsed = (Date.now() - new Date(state.start_time).getTime()) / 1000;
      timeRemaining = Math.max(0, state.duration - elapsed);
    }

    const response: AuctionStateResponse = {
      is_active: state.is_active,
      current_player: currentPlayer,
      current_bid: state.current_bid,
      current_bidder: currentBidder,
      start_time: state.start_time?.toISOString() || null,
      duration: state.duration,
      bid_increments: state.bid_increments || [100, 500, 1000],
      time_remaining: timeRemaining,
    };

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('Get auction state error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get auction state',
    });
  }
});

/**
 * GET /api/events/:eventId/auction/config
 * Get auction configuration
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const state = await queryOne<AuctionState>(
      'SELECT duration, bid_increments FROM auction_state WHERE event_id = $1',
      [eventId]
    );

    if (!state) {
      return res.status(404).json({
        success: false,
        error: 'Auction config not found',
      });
    }

    res.json({
      success: true,
      data: {
        duration: state.duration,
        bid_increments: state.bid_increments || [100, 500, 1000],
      },
    });
  } catch (error) {
    logger.error('Get auction config error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get auction config',
    });
  }
});

/**
 * PUT /api/events/:eventId/auction/config
 * Update auction configuration (admin only)
 */
router.put('/config', requireAuth, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { duration, bid_increments } = req.body;

    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (duration !== undefined) {
      updates.push(`duration = $${paramIndex}`);
      params.push(duration);
      paramIndex++;
    }

    if (bid_increments !== undefined) {
      updates.push(`bid_increments = $${paramIndex}`);
      params.push(JSON.stringify(bid_increments));
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }

    params.push(eventId);

    const state = await queryOne<AuctionState>(`
      UPDATE auction_state SET ${updates.join(', ')} WHERE event_id = $${paramIndex} RETURNING *
    `, params);

    if (!state) {
      return res.status(404).json({
        success: false,
        error: 'Auction config not found',
      });
    }

    logger.info('Auction config updated', { eventId });

    res.json({
      success: true,
      data: {
        duration: state.duration,
        bid_increments: state.bid_increments,
      },
    });
  } catch (error) {
    logger.error('Update auction config error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update auction config',
    });
  }
});

/**
 * POST /api/events/:eventId/auction/start
 * Start auction for a player (admin only)
 * Note: This is a basic implementation. Live auction will use WebSocket.
 */
router.post('/start', requireAuth, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { player_id } = req.body;

    if (!player_id) {
      return res.status(400).json({
        success: false,
        error: 'player_id is required',
      });
    }

    // Check if player exists and is available
    const player = await queryOne<Player>(
      'SELECT * FROM players WHERE id = $1 AND event_id = $2 AND status = $3',
      [player_id, eventId, 'available']
    );

    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found or not available',
      });
    }

    // Check if there's already an active auction
    const activeAuction = await queryOne<AuctionState>(
      'SELECT * FROM auction_state WHERE event_id = $1 AND is_active = TRUE',
      [eventId]
    );

    if (activeAuction) {
      return res.status(400).json({
        success: false,
        error: 'There is already an active auction',
      });
    }

    // Start the auction
    const state = await queryOne<AuctionState>(`
      UPDATE auction_state 
      SET is_active = TRUE, 
          current_player_id = $1,
          current_bid = $2,
          current_bidder_id = NULL,
          start_time = CURRENT_TIMESTAMP
      WHERE event_id = $3
      RETURNING *
    `, [player_id, player.base_price, eventId]);

    logger.info('Auction started', { eventId, playerId: player_id });

    res.json({
      success: true,
      data: {
        is_active: true,
        current_player: player,
        current_bid: player.base_price,
        current_bidder: null,
        start_time: state!.start_time?.toISOString(),
        duration: state!.duration,
      },
    });
  } catch (error) {
    logger.error('Start auction error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start auction',
    });
  }
});

/**
 * POST /api/events/:eventId/auction/bid
 * Place a bid
 * Note: This is a basic implementation. Live auction will use WebSocket.
 */
router.post('/bid', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { team_id, amount } = req.body;

    if (!team_id || !amount) {
      return res.status(400).json({
        success: false,
        error: 'team_id and amount are required',
      });
    }

    // Get current auction state
    const state = await queryOne<AuctionState>(
      'SELECT * FROM auction_state WHERE event_id = $1 AND is_active = TRUE',
      [eventId]
    );

    if (!state) {
      return res.status(400).json({
        success: false,
        error: 'No active auction',
      });
    }

    // Check if bid is higher than current bid
    if (amount <= (state.current_bid || 0)) {
      return res.status(400).json({
        success: false,
        error: 'Bid must be higher than current bid',
      });
    }

    // Check if team has enough coins
    const team = await queryOne<Team>(
      'SELECT * FROM teams WHERE id = $1 AND event_id = $2',
      [team_id, eventId]
    );

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }

    if (team.coins_left < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient coins',
      });
    }

    // Record the bid
    await queryOne(`
      INSERT INTO bids (event_id, player_id, team_id, amount)
      VALUES ($1, $2, $3, $4)
    `, [eventId, state.current_player_id, team_id, amount]);

    // Update auction state
    const updatedState = await queryOne<AuctionState>(`
      UPDATE auction_state 
      SET current_bid = $1, current_bidder_id = $2
      WHERE event_id = $3
      RETURNING *
    `, [amount, team_id, eventId]);

    logger.info('Bid placed', { eventId, teamId: team_id, amount });

    res.json({
      success: true,
      data: {
        current_bid: amount,
        current_bidder: {
          id: team.id,
          name: team.name,
          owner_name: team.owner_name,
        },
      },
    });
  } catch (error) {
    logger.error('Place bid error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to place bid',
    });
  }
});

/**
 * POST /api/events/:eventId/auction/end
 * End current auction (admin only)
 */
router.post('/end', requireAuth, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    // Get current auction state
    const state = await queryOne<AuctionState>(
      'SELECT * FROM auction_state WHERE event_id = $1 AND is_active = TRUE',
      [eventId]
    );

    if (!state) {
      return res.status(400).json({
        success: false,
        error: 'No active auction',
      });
    }

    // Determine outcome
    const isSold = state.current_bidder_id !== null;

    if (isSold) {
      // Update player as sold
      await queryOne(`
        UPDATE players 
        SET team_id = $1, sold_price = $2, status = 'sold'
        WHERE id = $3
      `, [state.current_bidder_id, state.current_bid, state.current_player_id]);
    } else {
      // Mark player as unsold
      await queryOne(
        'UPDATE players SET status = $1 WHERE id = $2',
        ['unsold', state.current_player_id]
      );
    }

    // Record auction lot
    await queryOne(`
      INSERT INTO auction_lots (event_id, player_id, final_bid, winning_team_id, status, lot_number)
      SELECT $1, $2, $3, $4, $5, COALESCE(MAX(lot_number), 0) + 1
      FROM auction_lots WHERE event_id = $1
    `, [eventId, state.current_player_id, state.current_bid, state.current_bidder_id, isSold ? 'sold' : 'unsold']);

    // Reset auction state
    await queryOne(`
      UPDATE auction_state 
      SET is_active = FALSE, 
          current_player_id = NULL,
          current_bid = NULL,
          current_bidder_id = NULL,
          start_time = NULL
      WHERE event_id = $1
    `, [eventId]);

    logger.info('Auction ended', { eventId, playerId: state.current_player_id, sold: isSold });

    res.json({
      success: true,
      data: {
        sold: isSold,
        player_id: state.current_player_id,
        final_bid: state.current_bid,
        winning_team_id: state.current_bidder_id,
      },
    });
  } catch (error) {
    logger.error('End auction error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end auction',
    });
  }
});

/**
 * POST /api/events/:eventId/auction/reset
 * Reset all auction data (admin only)
 */
router.post('/reset', requireAuth, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    // Reset all players
    await queryOne(`
      UPDATE players 
      SET team_id = NULL, sold_price = NULL, status = 'available'
      WHERE event_id = $1
    `, [eventId]);

    // Reset team coins
    await queryOne(`
      UPDATE teams SET coins_left = purse WHERE event_id = $1
    `, [eventId]);

    // Clear bids
    await queryOne('DELETE FROM bids WHERE event_id = $1', [eventId]);

    // Clear auction lots
    await queryOne('DELETE FROM auction_lots WHERE event_id = $1', [eventId]);

    // Reset auction state
    await queryOne(`
      UPDATE auction_state 
      SET is_active = FALSE, 
          current_player_id = NULL,
          current_bid = NULL,
          current_bidder_id = NULL,
          start_time = NULL
      WHERE event_id = $1
    `, [eventId]);

    logger.info('Auction reset', { eventId });

    res.json({
      success: true,
      message: 'Auction reset successfully',
    });
  } catch (error) {
    logger.error('Reset auction error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset auction',
    });
  }
});

/**
 * GET /api/events/:eventId/auction/history
 * Get auction bid history
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { player_id, limit = 100 } = req.query;

    let whereClause = 'WHERE b.event_id = $1';
    const params: unknown[] = [eventId];

    if (player_id) {
      params.push(player_id);
      whereClause += ` AND b.player_id = $${params.length}`;
    }

    params.push(limit);

    const bids = await queryAll<Bid & { player_name: string; team_name: string }>(`
      SELECT b.*, p.name as player_name, t.name as team_name
      FROM bids b
      JOIN players p ON b.player_id = p.id
      JOIN teams t ON b.team_id = t.id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT $${params.length}
    `, params);

    res.json({
      success: true,
      data: { bids },
    });
  } catch (error) {
    logger.error('Get auction history error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get auction history',
    });
  }
});

/**
 * GET /api/events/:eventId/auction/lots
 * Get auction lots (completed auctions)
 */
router.get('/lots', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const lots = await queryAll(`
      SELECT al.*, p.name as player_name, p.role as player_role, 
             t.name as winning_team_name
      FROM auction_lots al
      JOIN players p ON al.player_id = p.id
      LEFT JOIN teams t ON al.winning_team_id = t.id
      WHERE al.event_id = $1
      ORDER BY al.lot_number DESC
    `, [eventId]);

    res.json({
      success: true,
      data: { lots },
    });
  } catch (error) {
    logger.error('Get auction lots error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get auction lots',
    });
  }
});

export default router;
