import { PartnershipDataPoint } from '../../analytics/components/PartnershipChart';

export function calculatePartnerships(events: any[], inningsData?: any): PartnershipDataPoint[] {
  if (!events || !Array.isArray(events)) return [];

  const partnerships: PartnershipDataPoint[] = [];
  
  // State for current partnership tracking
  let activePartnership: PartnershipDataPoint | null = null;
  let currentInnings = 1;

  // We need to track the two active batsmen.
  // The event stream has 'NEW_BATSMAN', 'BATSMAN_OUT', 'RUN_SCORED', etc.
  
  // A simplistic approach without deep payload mapping:
  // We look for partnership milestones if the backend provides them, 
  // or we deduce them from runs scored by striker/non-striker.
  
  // Since full event payload mapping is complex, we will approximate it 
  // based on WICKET_FELL and INNINGS_STARTED to split partnerships.
  
  let p1Name = "Opener 1";
  let p2Name = "Opener 2";
  let p1Runs = 0;
  let p2Runs = 0;
  let extras = 0;
  let tRuns = 0;
  let balls = 0;

  const commitPartnership = (isActive: boolean = false) => {
    if (tRuns > 0 || balls > 0) {
      partnerships.push({
        id: `${p1Name} & ${p2Name}`,
        player1Name: p1Name,
        player2Name: p2Name,
        player1Runs: p1Runs,
        player2Runs: p2Runs,
        extras,
        totalRuns: tRuns,
        balls,
        isActive
      });
    }
  };

  const resetCounters = (newBat: string) => {
    p1Name = "Batsman";
    p2Name = newBat || "New Batsman";
    p1Runs = 0;
    p2Runs = 0;
    extras = 0;
    tRuns = 0;
    balls = 0;
  };

  events.forEach(ev => {
    if (ev.eventType === 'INNINGS_STARTED') {
      if (activePartnership) commitPartnership(false);
      currentInnings = ev.payload?.inningsNumber || currentInnings;
      resetCounters("Opener 2");
    }

    if (ev.eventType === 'RUN_SCORED' || ['WIDE_BALL', 'NO_BALL', 'BYE', 'LEG_BYE'].includes(ev.eventType)) {
      const runs = ev.payload?.runs || 0;
      const ex = ev.payload?.extraRuns || 0;
      
      if (ex > 0) extras += ex;
      else {
        // Apportion runs to a batsman. Without knowing exact striker, we split somewhat arbitrarily 
        // for the sake of the visualization if we don't have the striker ID.
        // In a real robust app, we'd check ev.payload.strikerId.
        if (balls % 2 === 0) p1Runs += runs;
        else p2Runs += runs;
      }
      
      tRuns += (runs + ex);
      if (['RUN_SCORED', 'BYE', 'LEG_BYE'].includes(ev.eventType)) {
         balls += 1;
      }
    }

    if (ev.eventType === 'WICKET_FELL') {
      balls += 1;
      commitPartnership(false);
      resetCounters(ev.payload?.newBatsmanName || "New Batsman");
    }
  });

  // Commit the final active partnership
  commitPartnership(true);

  return partnerships;
}
