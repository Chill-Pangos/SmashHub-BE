import { QueryTypes } from "sequelize";
import { sequelize } from "../config/database";

export async function withDbLock<T>(
  lockName: string,
  fn: () => Promise<T>,
): Promise<{ acquired: true; result: T } | { acquired: false }> {
  const rows = await sequelize.query<{ acquired: number }>(
    "SELECT GET_LOCK(:lockName, 0) AS acquired",
    {
      type: QueryTypes.SELECT,
      replacements: { lockName },
    },
  );

  if (rows[0]?.acquired !== 1) {
    return { acquired: false };
  }

  try {
    return { acquired: true, result: await fn() };
  } finally {
    await sequelize.query("SELECT RELEASE_LOCK(:lockName)", {
      type: QueryTypes.SELECT,
      replacements: { lockName },
    });
  }
}
