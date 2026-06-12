/**
 * Duckworth-Lewis-Stern (DLS) Calculator Utility
 * 
 * Provides standard mathematical models for calculating revised targets
 * in interrupted limited-overs cricket matches.
 * 
 * Note: This implementation uses a simplified T20 Standard Edition
 * Resource Percentage table suitable for club/local matches where
 * the professional ICC Professional Edition software is unavailable.
 */

// Simplified T20 Resource Percentage Table (Overs Left vs Wickets Lost)
// Format: Overs Left -> [0 wickets, 1 wicket, ... 9 wickets] lost
const T20_RESOURCE_TABLE: Record<number, number[]> = {
  20: [100.0, 93.4, 85.1, 74.9, 62.7, 49.0, 34.9, 22.0, 11.9, 4.7],
  19: [ 96.1, 90.0, 82.4, 72.9, 61.4, 48.3, 34.6, 21.8, 11.9, 4.7],
  18: [ 92.2, 86.6, 79.6, 70.8, 60.0, 47.6, 34.3, 21.7, 11.9, 4.7],
  17: [ 88.2, 83.1, 76.7, 68.7, 58.7, 46.8, 33.9, 21.6, 11.8, 4.7],
  16: [ 84.2, 79.5, 73.8, 66.5, 57.2, 46.0, 33.6, 21.5, 11.8, 4.7],
  15: [ 80.2, 75.9, 70.8, 64.2, 55.6, 45.1, 33.2, 21.3, 11.8, 4.7],
  14: [ 76.1, 72.3, 67.8, 61.8, 53.9, 44.1, 32.7, 21.2, 11.8, 4.7],
  13: [ 72.0, 68.6, 64.6, 59.2, 52.1, 43.1, 32.2, 21.0, 11.7, 4.7],
  12: [ 67.8, 64.9, 61.4, 56.6, 50.1, 41.9, 31.6, 20.8, 11.7, 4.7],
  11: [ 63.6, 61.1, 58.1, 53.8, 48.1, 40.5, 30.9, 20.5, 11.6, 4.7],
  10: [ 59.4, 57.2, 54.6, 50.9, 45.9, 39.1, 30.2, 20.2, 11.5, 4.7],
   9: [ 55.0, 53.2, 51.0, 47.8, 43.4, 37.4, 29.3, 19.8, 11.4, 4.7],
   8: [ 50.6, 49.1, 47.3, 44.6, 40.8, 35.5, 28.3, 19.4, 11.3, 4.7],
   7: [ 46.1, 44.9, 43.4, 41.2, 38.0, 33.4, 27.0, 18.8, 11.2, 4.7],
   6: [ 41.5, 40.6, 39.4, 37.6, 34.9, 31.1, 25.6, 18.2, 10.9, 4.7],
   5: [ 36.8, 36.1, 35.2, 33.8, 31.7, 28.5, 23.9, 17.4, 10.7, 4.7],
   4: [ 32.0, 31.5, 30.8, 29.8, 28.2, 25.7, 21.9, 16.3, 10.3, 4.7],
   3: [ 27.0, 26.6, 26.2, 25.5, 24.3, 22.5, 19.6, 15.0,  9.8, 4.7],
   2: [ 21.8, 21.6, 21.3, 20.8, 20.1, 18.9, 16.8, 13.3,  9.1, 4.6],
   1: [ 16.4, 16.3, 16.2, 15.9, 15.5, 14.8, 13.5, 11.1,  8.0, 4.4],
   0: [  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, 0.0]
};

/**
 * Gets the resource percentage remaining for a given match state.
 * Interpolates for fractional overs (e.g. 15.3 overs left)
 */
export const getResourcePercentage = (oversLeft: number, wicketsLost: number): number => {
  if (wicketsLost >= 10 || oversLeft <= 0) return 0.0;
  if (oversLeft >= 20) return T20_RESOURCE_TABLE[20][wicketsLost];

  const lowerBound = Math.floor(oversLeft);
  const upperBound = Math.ceil(oversLeft);
  
  if (lowerBound === upperBound) {
    return T20_RESOURCE_TABLE[lowerBound][wicketsLost];
  }

  const fraction = oversLeft - lowerBound;
  const lowerVal = T20_RESOURCE_TABLE[lowerBound][wicketsLost];
  const upperVal = T20_RESOURCE_TABLE[upperBound][wicketsLost];

  // Linear interpolation for fractional overs
  return lowerVal + fraction * (upperVal - lowerVal);
};

export interface DLSParams {
  team1Score: number;       // Runs scored by Team 1 in their innings
  team1OversTotal: number;  // Total scheduled overs for Team 1
  team1OversBatted: number; // Overs actually batted by Team 1
  team1WicketsLost: number; // Wickets lost by Team 1 (if innings interrupted)
  
  team2OversTotal: number;  // Initial scheduled overs for Team 2 (usually same as Team 1)
  team2OversReduced: number; // Revised scheduled overs for Team 2
  team2OversBatted: number; // Overs batted by Team 2 before interruption
  team2WicketsLost: number; // Wickets lost by Team 2 at time of interruption
}

/**
 * Calculates the revised target for Team 2 using the Standard Edition DLS method.
 * 
 * Formula:
 * If R2 < R1: Revised Target = S * (R2 / R1) + 1
 * If R2 = R1: Revised Target = S + 1
 * If R2 > R1: Revised Target = S + (R2 - R1) * G50 + 1 (G50 is avg 50-over score, usually 245)
 */
export const calculateDLSTarget = (params: DLSParams): number => {
  const {
    team1Score,
    team1OversTotal,
    team1OversBatted,
    team1WicketsLost,
    team2OversTotal,
    team2OversReduced
  } = params;

  // 1. Calculate Resources available to Team 1
  const team1InitialResources = getResourcePercentage(team1OversTotal, 0);
  
  let team1ResourcesDepleted = 0;
  if (team1OversBatted < team1OversTotal) {
      // Team 1 was interrupted entirely and innings closed early
      const oversLeftForTeam1 = team1OversTotal - team1OversBatted;
      team1ResourcesDepleted = getResourcePercentage(oversLeftForTeam1, team1WicketsLost);
  }
  const R1 = team1InitialResources - team1ResourcesDepleted;

  // 2. Calculate Resources available to Team 2
  // E.g. Match reduced to 15 overs before Team 2 starts
  const R2 = getResourcePercentage(team2OversReduced, 0);

  // 3. Compare Resources and compute Par/Target
  if (R2 < R1) {
    // Team 2 has fewer resources (e.g. rain reduced their overs)
    const revisedScore = Math.floor(team1Score * (R2 / R1));
    return revisedScore + 1; // Target is Par + 1
  } else if (R2 === R1) {
    return team1Score + 1;
  } else {
    // Penalty/Bonus if Team 2 somehow has MORE resources (rare in T20, usually happens if Team 1 innings was reduced but Team 2 gets full overs)
    // using G20 average score instead of G50 for T20s
    const G20 = 150; 
    const revisedScore = Math.floor(team1Score + ((R2 - R1) / 100) * G20);
    return revisedScore + 1;
  }
};

/**
 * Calculates the Par Score for Team 2 at a specific point in time (e.g. rain stops play midway).
 */
export const calculateDLSParScore = (params: DLSParams): number => {
  const {
    team1Score,
    team1OversTotal,
    team2OversReduced,
    team2OversBatted,
    team2WicketsLost
  } = params;

  // R1: assuming Team 1 got full uninterrupted 20 overs initially
  const R1 = getResourcePercentage(team1OversTotal, 0);

  // Resources Team 2 consumed
  const initialR2 = getResourcePercentage(team2OversReduced, 0);
  const R2Left = getResourcePercentage(team2OversReduced - team2OversBatted, team2WicketsLost);
  const R2Consumed = initialR2 - R2Left;

  // Par score is proportional to resources consumed vs Team 1's total resources
  const parScore = Math.floor(team1Score * (R2Consumed / R1));
  return parScore;
};
