import {
  CreateContentRuleDto,
  UpdateContentRuleDto,
} from "../dto/contentRule.dto";
import ContentRule from "../models/contentRule.model";

export class ContentRuleService {
  async create(data: CreateContentRuleDto): Promise<ContentRule> {
    return await ContentRule.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<ContentRule[]> {
    return await ContentRule.findAll({
      offset: skip,
      limit,
    });
  }

  async findById(id: number): Promise<ContentRule | null> {
    return await ContentRule.findByPk(id);
  }

  async findByContentId(contentId: number): Promise<ContentRule | null> {
    return await ContentRule.findOne({ where: { contentId } });
  }

  async update(
    id: number,
    data: UpdateContentRuleDto
  ): Promise<[number, ContentRule[]]> {
    return await ContentRule.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await ContentRule.destroy({ where: { id } });
  }
}

export default new ContentRuleService();
