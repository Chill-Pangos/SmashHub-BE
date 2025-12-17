import ComplaintMessage from "../models/complaintMessage.model";
import {
  CreateComplaintMessageDto,
  UpdateComplaintMessageDto,
} from "../dto/complaintMessage.dto";

export class ComplaintMessageService {
  async create(data: CreateComplaintMessageDto): Promise<ComplaintMessage> {
    return await ComplaintMessage.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<ComplaintMessage[]> {
    return await ComplaintMessage.findAll({
      offset: skip,
      limit,
      order: [["createdAt", "ASC"]],
    });
  }

  async findById(id: number): Promise<ComplaintMessage | null> {
    return await ComplaintMessage.findByPk(id);
  }

  async findByComplaintId(
    complaintId: number,
    skip = 0,
    limit = 10
  ): Promise<ComplaintMessage[]> {
    return await ComplaintMessage.findAll({
      where: { complaintId },
      offset: skip,
      limit,
      order: [["createdAt", "ASC"]],
    });
  }

  async findUnreadByReceiver(
    receiverId: number,
    skip = 0,
    limit = 10
  ): Promise<ComplaintMessage[]> {
    return await ComplaintMessage.findAll({
      where: { receiverId, isRead: false },
      offset: skip,
      limit,
      order: [["createdAt", "ASC"]],
    });
  }

  async update(
    id: number,
    data: UpdateComplaintMessageDto
  ): Promise<[number, ComplaintMessage[]]> {
    return await ComplaintMessage.update(data, {
      where: { id },
      returning: true,
    });
  }

  async markAsRead(id: number): Promise<[number, ComplaintMessage[]]> {
    return await ComplaintMessage.update(
      { isRead: true },
      {
        where: { id },
        returning: true,
      }
    );
  }

  async delete(id: number): Promise<number> {
    return await ComplaintMessage.destroy({ where: { id } });
  }
}

export default new ComplaintMessageService();
