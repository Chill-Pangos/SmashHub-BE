export const REFEREE_ROLES = ["chief", "referee"] as const;
export type RefereeRole = (typeof REFEREE_ROLES)[number];
