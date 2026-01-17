import { Transaction } from "sequelize";
import { sequelize } from "../config/database";

/**
 * Execute a function within a database transaction
 * Handles commit and rollback automatically
 */
export async function withTransaction<T>(
  callback: (transaction: Transaction) => Promise<T>
): Promise<T> {
  const transaction = await sequelize.transaction();
  
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
