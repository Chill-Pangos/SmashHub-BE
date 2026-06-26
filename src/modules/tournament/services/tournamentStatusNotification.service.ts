import Tournament from "../models/tournament.model";
import TournamentCategory from "../models/tournamentCategory.model";
import TournamentReferee from "../models/tournamentReferee.model";
import { notificationWriteService } from "../../notification/public.write";
import { NotificationTemplates } from "../../notification/public.templates";
import { registrationReadService } from "../../registration/public.read";
import { TournamentStatusTransition } from "./tournament.service";

const STATUS_LABELS: Record<string, string> = {
  registration_open: "open for registration",
  registration_closed: "closed for registration",
  brackets_generated: "ready for bracket generation",
  ongoing: "ongoing",
  cancelled: "cancelled",
};

class TournamentStatusNotificationService {
  async notifyTransitions(events: TournamentStatusTransition[]): Promise<void> {
    for (const event of events) {
      await this.notifyTransition(event);
    }
  }

  private async notifyTransition(event: TournamentStatusTransition): Promise<void> {
    const tournament = await Tournament.findByPk(event.tournamentId, {
      attributes: ["id", "name", "createdBy"],
    });
    if (!tournament) return;

    const recipientIds = await this.resolveRecipientIds(tournament);
    if (recipientIds.length === 0) return;

    const template = NotificationTemplates.tournamentStatusChanged(
      tournament.name,
      STATUS_LABELS[event.toStatus] ?? event.toStatus,
    );

    await notificationWriteService.notifyUsers(recipientIds, {
      ...template,
      referenceId: tournament.id,
      referenceType: "tournament",
      data: {
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        triggeredBy: event.triggeredBy,
        scheduledAt: event.scheduledAt?.toISOString() ?? null,
      },
    });
  }

  private async resolveRecipientIds(
    tournament: Pick<Tournament, "id" | "createdBy">,
  ): Promise<number[]> {
    const recipientIds = new Set<number>();
    recipientIds.add(tournament.createdBy);

    const referees = await TournamentReferee.findAll({
      where: { tournamentId: tournament.id },
      attributes: ["refereeId"],
      raw: true,
    });
    for (const referee of referees) {
      recipientIds.add(referee.refereeId);
    }

    const categories = await TournamentCategory.findAll({
      where: { tournamentId: tournament.id },
      attributes: ["id"],
      raw: true,
    });
    const categoryIds = categories.map((category) => category.id);
    if (categoryIds.length === 0) return [...recipientIds];

    const participantIds = await registrationReadService.getParticipantUserIdsByCategoryIds(
      categoryIds,
    );
    for (const userId of participantIds) {
      recipientIds.add(userId);
    }

    return [...recipientIds];
  }
}

export default new TournamentStatusNotificationService();
