import ComplaintWorkflow from "../models/complaintWorkflow.model";
import { CreateComplaintWorkflowDto } from "../dto/complaintWorkflow.dto";

export class ComplaintWorkflowService {
  async create(data: CreateComplaintWorkflowDto): Promise<ComplaintWorkflow> {
    return await ComplaintWorkflow.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<ComplaintWorkflow[]> {
    return await ComplaintWorkflow.findAll({
      offset: skip,
      limit,
      order: [["createdAt", "DESC"]],
    });
  }

  async findById(id: number): Promise<ComplaintWorkflow | null> {
    return await ComplaintWorkflow.findByPk(id);
  }

  async findByComplaintId(
    complaintId: number,
    skip = 0,
    limit = 10
  ): Promise<ComplaintWorkflow[]> {
    return await ComplaintWorkflow.findAll({
      where: { complaintId },
      offset: skip,
      limit,
      order: [["createdAt", "ASC"]],
    });
  }

  async findByUserId(
    userId: number,
    skip = 0,
    limit = 10
  ): Promise<ComplaintWorkflow[]> {
    return await ComplaintWorkflow.findAll({
      where: {
        $or: [{ fromUserId: userId }, { toUserId: userId }],
      } as any,
      offset: skip,
      limit,
      order: [["createdAt", "DESC"]],
    });
  }

  async delete(id: number): Promise<number> {
    return await ComplaintWorkflow.destroy({ where: { id } });
  }
}

export default new ComplaintWorkflowService();
