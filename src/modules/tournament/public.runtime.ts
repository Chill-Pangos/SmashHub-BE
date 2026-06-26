import tournamentService from "./services/tournament.service";
import tournamentStatusNotificationService from "./services/tournamentStatusNotification.service";

export const tournamentRuntimeService = {
  openRegistrations: () => tournamentService.openRegistrations(),
  closeRegistrations: () => tournamentService.closeRegistrations(),
  generateBracketsOrCancel: () => tournamentService.generateBracketsOrCancel(),
  startTournaments: () => tournamentService.startTournaments(),
  reconcileTournamentStatuses: () => tournamentService.reconcileTournamentStatuses(),
  getUpcomingStatusChanges: (hoursAhead = 24) =>
    tournamentService.getUpcomingStatusChanges(hoursAhead),
  notifyTransitions: (
    events: Awaited<ReturnType<typeof tournamentService.openRegistrations>>,
  ) => tournamentStatusNotificationService.notifyTransitions(events),
};

export type {
  TournamentStatusTransition,
  TournamentStatusTransitionTrigger,
  TournamentStatusUpdateResult,
} from "./services/tournament.service";
