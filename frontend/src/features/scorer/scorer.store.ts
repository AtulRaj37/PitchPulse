import { create } from 'zustand';
import { apiClient } from '@/services/api/api.client';
import { toast } from 'sonner';

export type EventType = 'RUN' | 'WICKET' | 'EXTRA';

export interface MatchEvent {
  id: string; // Unique client-side ID for the event
  type: EventType;
  value: number;       // Runs scored (0-6)
  batsmanId: string | null;
  bowlerId: string | null;
  over: number;
  ball: number;
  isWide?: boolean;
  isNoBall?: boolean;
  isBye?: boolean;
  isLegBye?: boolean;
}

export interface ScorerSnapshot {
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  strikerRuns: number;
  strikerBalls: number;
  striker4s: number;
  striker6s: number;
  nonStrikerRuns: number;
  nonStrikerBalls: number;
  nonStriker4s: number;
  nonStriker6s: number;
  bowlerBalls: number;
  bowlerRuns: number;
  bowlerWickets: number;
  bowlerMaidens: number;
  timeline: string[]; // ['1', 'W', '4', '0'] for the *current* over only
}

interface ScorerState {
  matchId: string | null;
  isLoading: boolean;
  
  // The Source of Truth
  events: MatchEvent[];

  // Match Flow
  innings: number; // 1 or 2
  target: number | null;

  // Active Selections
  strikerId: string | null;
  nonStrikerId: string | null;
  bowlerId: string | null;

  gullyRules: Record<string, boolean | number> | null;

  // Derived State (recalculated every time events change)
  score: ScorerSnapshot;

  // Actions
  setMatchId: (id: string) => void;
  setPlayers: (striker: string | null, nonStriker: string | null, bowler: string | null) => void;
  setBowler: (bowlerId: string | null) => void;
  setStriker: (strikerId: string | null) => void;
  
  scoreRuns: (runs: number, options?: { isWide?: boolean, isNoBall?: boolean, isBye?: boolean, isLegBye?: boolean }) => Promise<void>;
  markWicket: () => Promise<void>;
  undo: () => void;
  endInnings: () => void;
  initializeFromEvents: (matchData: any) => void;
}

const defaultSnapshot: ScorerSnapshot = {
  runs: 0,
  wickets: 0,
  overs: 0,
  balls: 0,
  strikerRuns: 0,
  strikerBalls: 0,
  striker4s: 0,
  striker6s: 0,
  nonStrikerRuns: 0,
  nonStrikerBalls: 0,
  nonStriker4s: 0,
  nonStriker6s: 0,
  bowlerBalls: 0,
  bowlerRuns: 0,
  bowlerWickets: 0,
  bowlerMaidens: 0,
  timeline: [],
};

// Helper to generate a random ID for optimistic tracking
const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * The Core Recalculation Engine
 * Takes an array of purely chronological events and plays them forward to build the current Snapshot.
 */
function recalculateState(events: MatchEvent[], innings: number, currentStriker: string | null, currentNonStriker: string | null, currentBowler: string | null): { 
  score: ScorerSnapshot 
} {
  const score = { ...defaultSnapshot };

  const playerStats: Record<string, { runs: number, balls: number, fours: number, sixes: number, wickets: number, runsConceded: number, ballsBowled: number, maidenOvers: number }> = {};
  const getP = (id: string | null) => {
    if (!id) return { runs: 0, balls: 0, fours: 0, sixes: 0, wickets: 0, runsConceded: 0, ballsBowled: 0, maidenOvers: 0 };
    if (!playerStats[id]) playerStats[id] = { runs: 0, balls: 0, fours: 0, sixes: 0, wickets: 0, runsConceded: 0, ballsBowled: 0, maidenOvers: 0 };
    return playerStats[id];
  };

  // To track maidens
  const overStats: Record<string, { bowlerId: string, runs: number, balls: number }> = {};

  events.forEach((ev) => {
    // 1. Calculate general match runs & balls
    const isExtras = !!(ev.isWide || ev.isNoBall || ev.isBye || ev.isLegBye);
    const extraRun = (ev.isWide || ev.isNoBall) ? 1 : 0;
    const legalDelivery = !(ev.isWide || ev.isNoBall);
    
    score.runs += (ev.value + extraRun);
    
    if (ev.type === 'WICKET') {
      score.wickets += 1;
    }

    if (legalDelivery) {
      score.balls += 1;
      if (score.balls === 6) {
        score.overs += 1;
        score.balls = 0;
      }
    }

    // 2. Timeline string
    let marker = ev.value.toString();
    if (ev.type === 'WICKET') marker = 'W';
    if (ev.isWide) marker = `${ev.value > 0 ? ev.value : ''}Wd`;
    if (ev.isNoBall) marker = `${ev.value > 0 ? ev.value : ''}Nb`;
    if (ev.isBye) marker = `${ev.value}B`;
    if (ev.isLegBye) marker = `${ev.value}Lb`;

    if (score.balls === 1 && legalDelivery) {
      score.timeline = [marker];
    } else if (score.balls === 0 && legalDelivery) {
      score.timeline.push(marker);
    } else {
      score.timeline.push(marker);
    }

    // 3. Accumulate Player Stats if IDs matched
    if (ev.batsmanId) {
      const bat = getP(ev.batsmanId);
      if (!isExtras) {
        bat.runs += ev.value;
        if (ev.value === 4) bat.fours += 1;
        if (ev.value === 6) bat.sixes += 1;
      }
      if (!ev.isWide) bat.balls += 1;
    }

    if (ev.bowlerId) {
      const bowl = getP(ev.bowlerId);
      const runsConceded = (ev.value + extraRun - (ev.isBye || ev.isLegBye ? ev.value : 0));
      bowl.runsConceded += runsConceded;
      if (legalDelivery) bowl.ballsBowled += 1;
      if (ev.type === 'WICKET') bowl.wickets += 1;

      // Track overs for maidens
      const overKey = `${score.overs}`;
      if (!overStats[overKey]) {
        overStats[overKey] = { bowlerId: ev.bowlerId, runs: 0, balls: 0 };
      }
      overStats[overKey].runs += runsConceded;
      if (legalDelivery) overStats[overKey].balls += 1;
    }
  });

  // Calculate maidens
  Object.values(overStats).forEach(os => {
    if (os.balls === 6 && os.runs === 0) {
      getP(os.bowlerId).maidenOvers += 1;
    }
  });

  // Hydrate the final active player stats into the snapshot
  const activeStrikerStats = getP(currentStriker);
  const activeNonStrikerStats = getP(currentNonStriker);
  const activeBowlerStats = getP(currentBowler);

  score.strikerRuns = activeStrikerStats.runs;
  score.strikerBalls = activeStrikerStats.balls;
  score.striker4s = activeStrikerStats.fours;
  score.striker6s = activeStrikerStats.sixes;
  
  score.nonStrikerRuns = activeNonStrikerStats.runs;
  score.nonStrikerBalls = activeNonStrikerStats.balls;
  score.nonStriker4s = activeNonStrikerStats.fours;
  score.nonStriker6s = activeNonStrikerStats.sixes;
  
  score.bowlerRuns = activeBowlerStats.runsConceded;
  score.bowlerWickets = activeBowlerStats.wickets;
  score.bowlerBalls = activeBowlerStats.ballsBowled;
  score.bowlerMaidens = activeBowlerStats.maidenOvers;

  return { score };
}


export const useScorerStore = create<ScorerState>((set, get) => ({
  matchId: null,
  isLoading: false,
  gullyRules: null,
  
  events: [],
  innings: 1,
  target: null,
  
  strikerId: null,
  nonStrikerId: null,
  bowlerId: null,
  
  score: { ...defaultSnapshot },

  setMatchId: (id) => set({ matchId: id }),
  
  initializeFromEvents: (matchData) => set((state) => {
    if (!matchData) return state;

    const backendEvents = matchData.events || [];
    
    // Grab rules from DB
    const incomingGullyRules = matchData.gullyRules || null;

    const rawBackendEvents = matchData.events || [];
    const mappedEvents: MatchEvent[] = [];

    rawBackendEvents.forEach((be: any) => {
      // Only process the primary delivery events to prevent double counting
      if (['BALL_BOWLED', 'WIDE_BALL', 'NO_BALL', 'BYE', 'LEG_BYE'].includes(be.eventType)) {
        let type: EventType = 'RUN';
        let isWide = false, isNoBall = false, isBye = false, isLegBye = false;

        if (be.eventType === 'WIDE_BALL') { type = 'EXTRA'; isWide = true; }
        if (be.eventType === 'NO_BALL') { type = 'EXTRA'; isNoBall = true; }
        if (be.eventType === 'BYE') { type = 'EXTRA'; isBye = true; }
        if (be.eventType === 'LEG_BYE') { type = 'EXTRA'; isLegBye = true; }

        mappedEvents.push({
          id: be.id,
          type,
          value: be.payload?.runs || be.payload?.extraRuns || 0,
          batsmanId: be.payload?.batsmanId || null,
          bowlerId: be.payload?.bowlerId || null,
          over: be.overNumber || 0,
          ball: be.ballNumber || 0,
          isWide, isNoBall, isBye, isLegBye
        });
      }

      // Upgrade the delivery to a wicket if the backend recorded a WICKET_FELL immediately after
      if (be.eventType === 'WICKET_FELL' && mappedEvents.length > 0) {
        mappedEvents[mappedEvents.length - 1].type = 'WICKET';
        // Explicitly use the WICKET_FELL's targeted batsmanId in case of a non-striker run-out
        if (be.payload?.batsmanId) {
          mappedEvents[mappedEvents.length - 1].batsmanId = be.payload.batsmanId;
        }
      }
    });

    const snap = matchData.currentSnapshot || {};
    
    // Recalculate full snapshot dynamically
    const { score } = recalculateState(
      mappedEvents,
      snap.innings || 1,
      snap.strikerId || null,
      snap.nonStrikerId || null,
      snap.bowlerId || null
    );

    return {
      matchId: matchData.id,
      gullyRules: incomingGullyRules,
      events: mappedEvents,
      innings: snap.innings || 1,
      target: snap.target || null,
      strikerId: snap.strikerId || null,
      nonStrikerId: snap.nonStrikerId || null,
      bowlerId: snap.bowlerId || null,
      score
    };
  }),
  
  setPlayers: (striker, nonStriker, bowler) => set((state) => {
    // Sync to backend
    if (state.matchId) {
      if (striker && state.strikerId !== striker) apiClient.post('/commands/change-striker', { matchId: state.matchId, newStrikerId: striker }).catch(console.error);
      if (nonStriker && state.nonStrikerId !== nonStriker) apiClient.post('/commands/change-non-striker', { matchId: state.matchId, newNonStrikerId: nonStriker }).catch(console.error);
      if (bowler && state.bowlerId !== bowler) apiClient.post('/commands/change-bowler', { matchId: state.matchId, newBowlerId: bowler }).catch(console.error);
      
      apiClient.patch(`/matches/${state.matchId}`, {
        currentSnapshot: {
          innings: state.innings,
          target: state.target,
          strikerId: striker,
          nonStrikerId: nonStriker,
          bowlerId: bowler
        }
      }).catch(console.error);
    }
    const { score } = recalculateState(state.events, state.innings, striker, nonStriker, bowler);
    return { strikerId: striker, nonStrikerId: nonStriker, bowlerId: bowler, score };
  }),

  setBowler: (bowlerId) => set((state) => {
    if (state.matchId && bowlerId) {
      apiClient.post('/commands/change-bowler', { matchId: state.matchId, newBowlerId: bowlerId }).catch(console.error);
      
      apiClient.patch(`/matches/${state.matchId}`, {
        currentSnapshot: {
          innings: state.innings,
          target: state.target,
          strikerId: state.strikerId,
          nonStrikerId: state.nonStrikerId,
          bowlerId: bowlerId
        }
      }).catch(console.error);
    }
    const { score } = recalculateState(state.events, state.innings, state.strikerId, state.nonStrikerId, bowlerId);
    return { bowlerId, score };
  }),

  setStriker: (strikerId) => set((state) => {
    if (state.matchId && strikerId) {
      apiClient.post('/commands/change-striker', { matchId: state.matchId, newStrikerId: strikerId }).catch(console.error);
      
      apiClient.patch(`/matches/${state.matchId}`, {
        currentSnapshot: {
          innings: state.innings,
          target: state.target,
          strikerId: strikerId,
          nonStrikerId: state.nonStrikerId,
          bowlerId: state.bowlerId
        }
      }).catch(console.error);
    }
    const { score } = recalculateState(state.events, state.innings, strikerId, state.nonStrikerId, state.bowlerId);
    return { strikerId, score };
  }),

  endInnings: async () => {
    const state = get();
    if (state.innings === 2) return; // Already 2nd innings

    const newTarget = state.score.runs + 1;

    try {
      // Sync to backend first
      if (state.matchId) {
        await apiClient.post('/commands/complete-innings', { 
          matchId: state.matchId,
          inningsNumber: state.innings,
          declared: false,
          followOn: false
        });
        
        // Update snapshot target locally on DB
        await apiClient.patch(`/matches/${state.matchId}`, {
          currentSnapshot: {
            innings: 2,
            target: newTarget,
            strikerId: null,
            nonStrikerId: null,
            bowlerId: null
          }
        });
      }
    } catch (err) {
      console.error('Failed to sync end innings', err);
    }

    // Move to 2nd innings locally
    set({
      innings: 2,
      target: newTarget,
      events: [], // Reset events for new innings
      score: { ...defaultSnapshot },
      strikerId: null,
      nonStrikerId: null,
      bowlerId: null
    });
  },

  scoreRuns: async (runs, options = {}) => {
    const state = get();
    if (!state.matchId) return;

    // Block if missing players (safety check)
    if (!state.strikerId || !state.nonStrikerId || !state.bowlerId) {
      console.warn("Missing active players - cannot score");
      return;
    }

    const { isWide, isNoBall, isBye, isLegBye } = options;
    const isExtras = !!(isWide || isNoBall || isBye || isLegBye);

    // --- GULLY RULES INTERCEPTS ---
    if (state.gullyRules) {
      // 1. Direct 6 = OUT
      if (runs === 6 && state.gullyRules.sixIsOut) {
        toast.error("Gully Rule Enforced: Direct 6 is OUT!", { icon: "🔥", duration: 4000 });
        return state.markWicket();
      }

      // 2. Ball Miss Out
      if (runs === 0 && !isExtras && state.gullyRules.ballMissOut) {
        const limit = state.gullyRules.ballMissOut as number;
        let dotCount = 1; // include current
        for (let i = state.events.length - 1; i >= 0; i--) {
          const e = state.events[i];
          if (e.batsmanId !== state.strikerId) break; // End if not striker
          const eIsExtras = !!(e.isWide || e.isNoBall || e.isBye || e.isLegBye);
          if (e.type !== 'RUN' || eIsExtras) break; // Not a regular ball
          if (e.value === 0) dotCount++; // Found dot
          else break; // Found run
        }
        
        if (dotCount >= limit) {
          toast.error(`Gully Rule Enforced: ${limit} consecutive misses is OUT!`, { icon: "🔥", duration: 4000 });
          return state.markWicket();
        }
      }
    }
    // --- END GULLY RULES ---

    const newEvent: MatchEvent = {
       id: generateId(),
       type: isExtras ? 'EXTRA' : 'RUN',
       value: runs,
       batsmanId: state.strikerId,
       bowlerId: state.bowlerId,
       over: state.score.overs,
       ball: state.score.balls,
       isWide,
       isNoBall,
       isBye,
       isLegBye
    };

    const newEvents = [...state.events, newEvent];
    const { score } = recalculateState(
      newEvents, 
      state.innings, 
      state.strikerId, 
      state.nonStrikerId, 
      state.bowlerId
    );

    let newStrikerId: string | null = state.strikerId;
    let newNonStrikerId: string | null = state.nonStrikerId;
    let newBowlerId: string | null = state.bowlerId;

    const legalDelivery = !(isWide || isNoBall);

    if (runs % 2 !== 0 && legalDelivery) {
      const temp = newStrikerId;
      newStrikerId = newNonStrikerId;
      newNonStrikerId = temp;
    }

    if (score.balls === 0 && legalDelivery) {
      const temp = newStrikerId;
      newStrikerId = newNonStrikerId;
      newNonStrikerId = temp;
      newBowlerId = null;
    }

    set({ 
      events: newEvents, 
      score, 
      strikerId: newStrikerId, 
      nonStrikerId: newNonStrikerId, 
      bowlerId: newBowlerId 
    });

    try {
      // 1. Persist the actual event to the backend Event store FIRST
      // This allows the Event Validator to check against the PRE-ROTATION snapshot
      if (isWide) {
        await apiClient.post('/commands/wide', { matchId: state.matchId, batsmanId: state.strikerId, bowlerId: state.bowlerId, extraRuns: runs });
      } else if (isNoBall) {
        await apiClient.post('/commands/no-ball', { matchId: state.matchId, batsmanId: state.strikerId, bowlerId: state.bowlerId, extraRuns: runs });
      } else if (isBye) {
        await apiClient.post('/commands/bye', { matchId: state.matchId, batsmanId: state.strikerId, bowlerId: state.bowlerId, runs });
      } else if (isLegBye) {
        await apiClient.post('/commands/leg-bye', { matchId: state.matchId, batsmanId: state.strikerId, bowlerId: state.bowlerId, runs });
      } else {
        await apiClient.post('/commands/score-run', { matchId: state.matchId, batsmanId: state.strikerId, bowlerId: state.bowlerId, runs });
      }

      // 2. Auto-transition match from CREATED to LIVE on first scoring action AND patch the updated snapshot
      const patchData: any = {
        currentSnapshot: {
          innings: state.innings,
          target: state.target,
          strikerId: newStrikerId,
          nonStrikerId: newNonStrikerId,
          bowlerId: newBowlerId
        }
      };

      if (newEvents.length === 1) {
        patchData.status = 'LIVE';
      }

      await apiClient.patch(`/matches/${state.matchId}`, patchData);

    } catch (err: any) {
      console.error('API Sync Failed', err);
      toast.error(err?.response?.data?.error?.message || 'API Sync Failed: Match offline');
    }
  },

  markWicket: async () => {
    const state = get();
    if (!state.matchId) return;

    if (!state.strikerId || !state.nonStrikerId || !state.bowlerId) return;

    const newEvent: MatchEvent = {
       id: generateId(),
       type: 'WICKET',
       value: 0,
       batsmanId: state.strikerId,
       bowlerId: state.bowlerId,
       over: state.score.overs,
       ball: state.score.balls,
    };

    const newEvents = [...state.events, newEvent];
    const { score } = recalculateState(
      newEvents, 
      state.innings, 
      state.strikerId, 
      state.nonStrikerId, 
      state.bowlerId
    );

    let newStrikerId: string | null = null; // Wicket clears active striker
    let newNonStrikerId: string | null = state.nonStrikerId;
    let newBowlerId: string | null = state.bowlerId;

    if (score.balls === 0) {
      const temp = newStrikerId;
      newStrikerId = newNonStrikerId;
      newNonStrikerId = temp;
      newBowlerId = null;
    }

    set({ 
      events: newEvents, 
      score, 
      strikerId: newStrikerId, 
      nonStrikerId: newNonStrikerId, 
      bowlerId: newBowlerId 
    });

    try {
      // 1. Record the Event FIRST
      await apiClient.post('/commands/wicket', {
        matchId: state.matchId,
        batsmanId: state.strikerId!,
        bowlerId: state.bowlerId!,
        wicketType: 'BOWLED',
        dismissalMode: 'BATSMAN_OUT'
      });

      // 2. Patch the empty striker slots to backend 
      const patchData: any = {
        currentSnapshot: {
          innings: state.innings,
          target: state.target,
          strikerId: newStrikerId,
          nonStrikerId: newNonStrikerId,
          bowlerId: newBowlerId
        }
      };

      await apiClient.patch(`/matches/${state.matchId}`, patchData);
    } catch (err: any) {
      console.error('API Sync Failed', err);
      toast.error(err?.response?.data?.error?.message || 'API Sync Failed: Match offline');
    }
  },

  undo: async () => {
    const state = get();
    if (state.events.length === 0 || !state.matchId) return;
    
    // Pop last event
    const newEvents = state.events.slice(0, -1);
    
    // Recalculate everything from scratch against the remaining events.
    // Note: undoing a wicket means we need to put the Striker ID *back*. 
    // To do this perfectly, we should look back in the events to see who was on strike, 
    // but a common pattern is just requiring the user to select the players again if it gets lost.
    // However, recalculateState uses the active variables and modifies them.
    // Wait, recalculateState tracks active players *forward*. If we go backward, the previous state's player IDs should be restored securely.
    // So the simplest way is to keep history of the entire ID tuple for undo. 
    set((s) => {
        const rec = recalculateState(newEvents, s.innings, s.strikerId, s.nonStrikerId, s.bowlerId);
        return { events: newEvents, score: rec.score };
    });
    
    try {
      await apiClient.post('/commands/undo', { matchId: state.matchId });

      await apiClient.patch(`/matches/${state.matchId}`, {
        currentSnapshot: {
          innings: state.innings,
          target: state.target,
          strikerId: state.strikerId,
          nonStrikerId: state.nonStrikerId,
          bowlerId: state.bowlerId
        }
      });
    } catch (err) {
      console.error('Failed to sync undo', err);
    }
  }
}));
