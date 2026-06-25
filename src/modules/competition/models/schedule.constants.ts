export const STAGES = ["group", "knockout"] as const;
export type Stage = (typeof STAGES)[number];

export const KNOCKOUT_ROUNDS = [
  "Round of 64",
  "Round of 32",
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "Third-place",
  "Final",
] as const;
export type KnockoutRound = (typeof KNOCKOUT_ROUNDS)[number];
