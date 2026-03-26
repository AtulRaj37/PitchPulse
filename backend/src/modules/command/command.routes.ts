// Command Routes
// RESTful endpoints for cricket scoring commands
//
// Endpoints:
// - POST /commands/score-run
// - POST /commands/wicket
// - POST /commands/start-innings
// - POST /commands/complete-innings
// - POST /commands/toss
// - POST /commands/start-match
// - POST /commands/complete-match
// - POST /commands/abandon-match
// - POST /commands/wide
// - POST /commands/no-ball
// - POST /commands/bye
// - POST /commands/leg-bye
// - POST /commands/change-bowler
// - GET /commands/match/:matchId/state

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { executeCommand } from './command.service.js';
import {
  type ScoreRunCommand,
  type WicketCommand,
  type WideCommand,
  type NoBallCommand,
  type ByeCommand,
  type LegByeCommand,
  type StartInningsCommand,
  type CompleteInningsCommand,
  type TossCommand,
  type StartMatchCommand,
  type CompleteMatchCommand,
  type AbandonMatchCommand,
  type ChangeBowlerCommand,
  type ChangeStrikerCommand,
  type ChangeNonStrikerCommand,
  type CricketCommand,
} from './command.types.js';
import { validateBody } from '../../core/validation/schemas.js';
import { requireAuth } from '../../core/middleware/auth.middleware.js';
import { scoringRateLimitPlugin, scoringRateLimitConfig } from '../../core/middleware/scoring-rate-limit.js';
import { commandLogger as logger } from '../../shared/utils/logger.js';

// ============================================
// SCHEMAS
// ============================================

const scoreRunSchema = z.object({
  matchId: z.string().uuid(),
  runs: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(6)]),
  batsmanId: z.string().uuid(),
  bowlerId: z.string().uuid(),
  commentary: z.string().max(500).optional(),
});

const wicketSchema = z.object({
  matchId: z.string().uuid(),
  batsmanId: z.string().uuid(),
  bowlerId: z.string().uuid(),
  wicketType: z.enum(['BOWLED', 'CAUGHT', 'LBW', 'STUMPED', 'RUN_OUT', 'HIT_WICKET', 'HANDLED_BALL', 'TIMED_OUT']),
  dismissalMode: z.enum(['BATSMAN_OUT', 'RETIRED_HURT', 'NOT_OUT']),
  fielderId: z.string().uuid().optional(),
  newBatsmanId: z.string().uuid().optional(),
  commentary: z.string().max(500).optional(),
});

const wideSchema = z.object({
  matchId: z.string().uuid(),
  bowlerId: z.string().uuid(),
  batsmanId: z.string().uuid(),
  extraRuns: z.number().int().min(1).max(10),
  commentary: z.string().max(500).optional(),
});

const noBallSchema = z.object({
  matchId: z.string().uuid(),
  bowlerId: z.string().uuid(),
  batsmanId: z.string().uuid(),
  extraRuns: z.number().int().min(0).max(10),
  isFreeHit: z.boolean().default(false),
  commentary: z.string().max(500).optional(),
});

const byeSchema = z.object({
  matchId: z.string().uuid(),
  batsmanId: z.string().uuid(),
  bowlerId: z.string().uuid(),
  runs: z.number().int().min(1).max(6),
  commentary: z.string().max(500).optional(),
});

const legByeSchema = z.object({
  matchId: z.string().uuid(),
  batsmanId: z.string().uuid(),
  bowlerId: z.string().uuid(),
  runs: z.number().int().min(1).max(6),
  commentary: z.string().max(500).optional(),
});

const startInningsSchema = z.object({
  matchId: z.string().uuid(),
  inningsNumber: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  battingTeamId: z.string().uuid(),
  bowlingTeamId: z.string().uuid(),
  strikerId: z.string().uuid(),
  nonStrikerId: z.string().uuid(),
  bowlerId: z.string().uuid(),
});

const completeInningsSchema = z.object({
  matchId: z.string().uuid(),
  inningsNumber: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  declared: z.boolean().default(false),
  followOn: z.boolean().default(false),
});

const tossSchema = z.object({
  matchId: z.string().uuid(),
  winnerTeamId: z.string().uuid(),
  decision: z.enum(['BAT', 'BOWL']),
});

const startMatchSchema = z.object({
  matchId: z.string().uuid(),
});

const completeMatchSchema = z.object({
  matchId: z.string().uuid(),
  winnerTeamId: z.string().uuid().optional(),
  margin: z.string().max(100).optional(),
  playerOfMatch: z.string().uuid().optional(),
});

const abandonMatchSchema = z.object({
  matchId: z.string().uuid(),
  reason: z.string().min(10).max(500),
});

const changeBowlerSchema = z.object({
  matchId: z.string().uuid(),
  newBowlerId: z.string().uuid(),
});

const changeStrikerSchema = z.object({
  matchId: z.string().uuid(),
  newStrikerId: z.string().uuid(),
});

const changeNonStrikerSchema = z.object({
  matchId: z.string().uuid(),
  newNonStrikerId: z.string().uuid(),
});

// ============================================
// CONTEXT HELPER
// ============================================

function getCommandContext(request: FastifyRequest): {
  userId: string;
  source: string;
  ipAddress: string | undefined;
} {
  const user = (request as FastifyRequest & { user: { userId: string } }).user;
  const source = request.headers['x-source'] as string | undefined ?? 'api';
  const ipAddress = request.ip;

  return {
    userId: user.userId,
    source,
    ipAddress,
  };
}

// ============================================
// ROUTE REGISTRATION
// ============================================

export default async function commandRoutes(app: FastifyInstance): Promise<void> {
  // Apply scoring rate limiting (stricter than global rate limit)
  await app.register(scoringRateLimitPlugin);

  // Apply authentication to all command routes
  app.addHook('preHandler', requireAuth);

  // ========================================
  // SCORE RUN
  // POST /commands/score-run
  // ========================================
  app.post('/score-run', {
    preHandler: validateBody(scoreRunSchema),
    schema: {
      description: 'Score runs (0-6) for a legal delivery',
      tags: ['Commands'],
      body: {
        type: 'object',
        required: ['matchId', 'runs', 'batsmanId', 'bowlerId'],
        properties: {
          matchId: { type: 'string', format: 'uuid' },
          runs: { type: 'number', enum: [0, 1, 2, 3, 4, 6] },
          batsmanId: { type: 'string', format: 'uuid' },
          bowlerId: { type: 'string', format: 'uuid' },
          commentary: { type: 'string', maxLength: 500 },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof scoreRunSchema>;
    const context = getCommandContext(request);

    const command: CricketCommand = {
      type: 'SCORE_RUN',
      payload: {
        matchId: body.matchId,
        runs: body.runs,
        batsmanId: body.batsmanId,
        bowlerId: body.bowlerId,
        commentary: body.commentary,
        timestamp: new Date(),
      } as ScoreRunCommand,
    };

    const result = await executeCommand(command, context);
    return reply.status(200).send(result);
  });

  // ========================================
  // WICKET
  // POST /commands/wicket
  // ========================================
  app.post('/wicket', {
    preHandler: validateBody(wicketSchema),
    schema: {
      description: 'Record a wicket',
      tags: ['Commands'],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof wicketSchema>;
    const context = getCommandContext(request);

    const command: CricketCommand = {
      type: 'WICKET',
      payload: {
        matchId: body.matchId,
        batsmanId: body.batsmanId,
        bowlerId: body.bowlerId,
        wicketType: body.wicketType,
        dismissalMode: body.dismissalMode,
        fielderId: body.fielderId,
        newBatsmanId: body.newBatsmanId,
        commentary: body.commentary,
        timestamp: new Date(),
      } as WicketCommand,
    };

    const result = await executeCommand(command, context);
    return reply.status(200).send(result);
  });

  // ========================================
  // WIDE
  // POST /commands/wide
  // ========================================
  app.post('/wide', {
    preHandler: validateBody(wideSchema),
    schema: {
      description: 'Record a wide ball',
      tags: ['Commands'],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof wideSchema>;
    const context = getCommandContext(request);

    const command: CricketCommand = {
      type: 'WIDE',
      payload: {
        matchId: body.matchId,
        bowlerId: body.bowlerId,
        batsmanId: body.batsmanId,
        extraRuns: body.extraRuns,
        commentary: body.commentary,
        timestamp: new Date(),
      } as WideCommand,
    };

    const result = await executeCommand(command, context);
    return reply.status(200).send(result);
  });

  // ========================================
  // NO BALL
  // POST /commands/no-ball
  // ========================================
  app.post('/no-ball', {
    preHandler: validateBody(noBallSchema),
    schema: {
      description: 'Record a no-ball',
      tags: ['Commands'],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof noBallSchema>;
    const context = getCommandContext(request);

    const command: CricketCommand = {
      type: 'NO_BALL',
      payload: {
        matchId: body.matchId,
        bowlerId: body.bowlerId,
        batsmanId: body.batsmanId,
        extraRuns: body.extraRuns,
        isFreeHit: body.isFreeHit,
        commentary: body.commentary,
        timestamp: new Date(),
      } as NoBallCommand,
    };

    const result = await executeCommand(command, context);
    return reply.status(200).send(result);
  });

  // ========================================
  // BYE
  // POST /commands/bye
  // ========================================
  app.post('/bye', {
    preHandler: validateBody(byeSchema),
    schema: {
      description: 'Record bye runs',
      tags: ['Commands'],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof byeSchema>;
    const context = getCommandContext(request);

    const command: CricketCommand = {
      type: 'BYE',
      payload: {
        matchId: body.matchId,
        batsmanId: body.batsmanId,
        bowlerId: body.bowlerId,
        runs: body.runs,
        commentary: body.commentary,
        timestamp: new Date(),
      } as ByeCommand,
    };

    const result = await executeCommand(command, context);
    return reply.status(200).send(result);
  });

  // ========================================
  // LEG BYE
  // POST /commands/leg-bye
  // ========================================
  app.post('/leg-bye', {
    preHandler: validateBody(legByeSchema),
    schema: {
      description: 'Record leg bye runs',
      tags: ['Commands'],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof legByeSchema>;
    const context = getCommandContext(request);

    const command: CricketCommand = {
      type: 'LEG_BYE',
      payload: {
        matchId: body.matchId,
        batsmanId: body.batsmanId,
        bowlerId: body.bowlerId,
        runs: body.runs,
        commentary: body.commentary,
        timestamp: new Date(),
      } as LegByeCommand,
    };

    const result = await executeCommand(command, context);
    return reply.status(200).send(result);
  });

  // ========================================
  // START INNINGS
  // POST /commands/start-innings
  // ========================================
  app.post('/start-innings', {
    preHandler: validateBody(startInningsSchema),
    schema: {
      description: 'Start a new innings',
      tags: ['Commands'],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof startInningsSchema>;
    const context = getCommandContext(request);

    const command: CricketCommand = {
      type: 'START_INNINGS',
      payload: {
        matchId: body.matchId,
        inningsNumber: body.inningsNumber,
        battingTeamId: body.battingTeamId,
        bowlingTeamId: body.bowlingTeamId,
        strikerId: body.strikerId,
        nonStrikerId: body.nonStrikerId,
        bowlerId: body.bowlerId,
        timestamp: new Date(),
      } as StartInningsCommand,
    };

    const result = await executeCommand(command, context);
    return reply.status(200).send(result);
  });

  // ========================================
  // COMPLETE INNINGS
  // POST /commands/complete-innings
  // ========================================
  app.post('/complete-innings', {
    preHandler: validateBody(completeInningsSchema),
    schema: {
      description: 'Complete the current innings',
      tags: ['Commands'],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof completeInningsSchema>;
    const context = getCommandContext(request);

    const command: CricketCommand = {
      type: 'COMPLETE_INNINGS',
      payload: {
        matchId: body.matchId,
        inningsNumber: body.inningsNumber,
        declared: body.declared,
        followOn: body.followOn,
        timestamp: new Date(),
      } as CompleteInningsCommand,
    };

    const result = await executeCommand(command, context);
    return reply.status(200).send(result);
  });

  // ========================================
  // TOSS
  // POST /commands/toss
  // ========================================
  app.post('/toss', {
    preHandler: validateBody(tossSchema),
    schema: {
      description: 'Record toss result',
      tags: ['Commands'],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof tossSchema>;
    const context = getCommandContext(request);

    const command: CricketCommand = {
      type: 'TOSS',
      payload: {
        matchId: body.matchId,
        winnerTeamId: body.winnerTeamId,
        decision: body.decision,
        timestamp: new Date(),
      } as TossCommand,
    };

    const result = await executeCommand(command, context);
    return reply.status(200).send(result);
  });

  // ========================================
  // START MATCH
  // POST /commands/start-match
  // ========================================
  app.post('/start-match', {
    preHandler: validateBody(startMatchSchema),
    schema: {
      description: 'Start the match (set status to LIVE)',
      tags: ['Commands'],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof startMatchSchema>;
    const context = getCommandContext(request);

    const command: CricketCommand = {
      type: 'START_MATCH',
      payload: {
        matchId: body.matchId,
        timestamp: new Date(),
      } as StartMatchCommand,
    };

    const result = await executeCommand(command, context);
    return reply.status(200).send(result);
  });

  // ========================================
  // COMPLETE MATCH
  // POST /commands/complete-match
  // ========================================
  app.post('/complete-match', {
    preHandler: validateBody(completeMatchSchema),
    schema: {
      description: 'Complete the match',
      tags: ['Commands'],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof completeMatchSchema>;
    const context = getCommandContext(request);

    const command: CricketCommand = {
      type: 'COMPLETE_MATCH',
      payload: {
        matchId: body.matchId,
        winnerTeamId: body.winnerTeamId,
        margin: body.margin,
        playerOfMatch: body.playerOfMatch,
        timestamp: new Date(),
      } as CompleteMatchCommand,
    };

    const result = await executeCommand(command, context);
    return reply.status(200).send(result);
  });

  // ========================================
  // ABANDON MATCH
  // POST /commands/abandon-match
  // ========================================
  app.post('/abandon-match', {
    preHandler: validateBody(abandonMatchSchema),
    schema: {
      description: 'Abandon the match',
      tags: ['Commands'],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof abandonMatchSchema>;
    const context = getCommandContext(request);

    const command: CricketCommand = {
      type: 'ABANDON_MATCH',
      payload: {
        matchId: body.matchId,
        reason: body.reason,
        timestamp: new Date(),
      } as AbandonMatchCommand,
    };

    const result = await executeCommand(command, context);
    return reply.status(200).send(result);
  });

  // ========================================
  // CHANGE BOWLER
  // POST /commands/change-bowler
  // ========================================
  app.post('/change-bowler', {
    preHandler: validateBody(changeBowlerSchema),
    schema: {
      description: 'Change the current bowler',
      tags: ['Commands'],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof changeBowlerSchema>;
    const context = getCommandContext(request);

    const command: CricketCommand = {
      type: 'CHANGE_BOWLER',
      payload: {
        matchId: body.matchId,
        newBowlerId: body.newBowlerId,
        timestamp: new Date(),
      } as ChangeBowlerCommand,
    };

    const result = await executeCommand(command, context);
    return reply.status(200).send(result);
  });

  // ========================================
  // CHANGE STRIKER
  // POST /commands/change-striker
  // ========================================
  app.post('/change-striker', {
    preHandler: validateBody(changeStrikerSchema),
    schema: {
      tags: ['Commands'],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof changeStrikerSchema>;
    const context = getCommandContext(request);

    const command: CricketCommand = {
      type: 'CHANGE_STRIKER',
      payload: {
        matchId: body.matchId,
        newStrikerId: body.newStrikerId,
        timestamp: new Date(),
      } as ChangeStrikerCommand,
    };

    const result = await executeCommand(command, context);
    return reply.status(200).send(result);
  });

  // ========================================
  // CHANGE NON STRIKER
  // POST /commands/change-non-striker
  // ========================================
  app.post('/change-non-striker', {
    preHandler: validateBody(changeNonStrikerSchema),
    schema: {
      tags: ['Commands'],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof changeNonStrikerSchema>;
    const context = getCommandContext(request);

    const command: CricketCommand = {
      type: 'CHANGE_NON_STRIKER',
      payload: {
        matchId: body.matchId,
        newNonStrikerId: body.newNonStrikerId,
        timestamp: new Date(),
      } as ChangeNonStrikerCommand,
    };

    const result = await executeCommand(command, context);
    return reply.status(200).send(result);
  });

  logger.info('Command routes registered');
}
