import Complaint from "../models/complaint.model";
import { CreateComplaintDto, UpdateComplaintDto } from "../dto/complaint.dto";

export class ComplaintService {
  async create(data: CreateComplaintDto): Promise<Complaint> {
    return await Complaint.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<Complaint[]> {
    return await Complaint.findAll({
      offset: skip,
      limit,
      order: [["createdAt", "DESC"]],
    });
  }

  async findById(id: number): Promise<Complaint | null> {
    return await Complaint.findByPk(id);
  }

  async findByUserId(
    userId: number,
    skip = 0,
    limit = 10
  ): Promise<Complaint[]> {
    return await Complaint.findAll({
      where: { createdBy: userId },
      offset: skip,
      limit,
      order: [["createdAt", "DESC"]],
    });
  }

  async findByTournamentId(
    tournamentId: number,
    skip = 0,
    limit = 10
  ): Promise<Complaint[]> {
    return await Complaint.findAll({
      where: { tournamentId },
      offset: skip,
      limit,
      order: [["createdAt", "DESC"]],
    });
  }

  async findByStatus(
    status: string,
    skip = 0,
    limit = 10
  ): Promise<Complaint[]> {
    return await Complaint.findAll({
      where: { status },
      offset: skip,
      limit,
      order: [["createdAt", "DESC"]],
    });
  }

  async update(
    id: number,
    data: UpdateComplaintDto
  ): Promise<[number, Complaint[]]> {
    return await Complaint.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await Complaint.destroy({ where: { id } });
  }
}

export default new ComplaintService();
