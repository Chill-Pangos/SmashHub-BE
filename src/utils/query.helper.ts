/**
 * Common include options for queries
 */
export class QueryHelper {
  /**
   * Calculate pagination info
   */
  static calculatePagination(count: number, offset: number, limit?: number) {
    const currentLimit = limit && limit > 0 ? limit : count;
    const currentPage = currentLimit > 0 ? Math.floor(offset / currentLimit) + 1 : 1;
    const totalPages = currentLimit > 0 ? Math.ceil(count / currentLimit) : 1;

    return {
      total: count,
      page: currentPage,
      limit: currentLimit,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    };
  }

  /**
   * Create empty pagination response
   */
  static emptyPagination(limit?: number) {
    return {
      total: 0,
      page: 1,
      limit: limit && limit > 0 ? limit : 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    };
  }
}
