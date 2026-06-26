import Role from "../models/role.model";
import Permission from "../models/permission.model";
import User from "../models/user.model";
import config from "../config/config";

export type UserAccessSnapshot = {
  roles: Set<string>;
  permissions: Set<string>;
};

type CacheEntry = {
  expiresAt: number;
  snapshot: UserAccessSnapshot;
};

class PermissionCacheService {
  private cache = new Map<number, CacheEntry>();

  async getUserAccess(userId: number): Promise<UserAccessSnapshot | null> {
    const ttlMs = config.permissionCache.ttlSeconds * 1000;
    const now = Date.now();
    const cached = this.cache.get(userId);
    if (ttlMs > 0 && cached && cached.expiresAt > now) {
      return cached.snapshot;
    }

    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: "roles",
          through: { attributes: [] },
          include: [
            {
              model: Permission,
              as: "permissions",
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    if (!user) {
      this.cache.delete(userId);
      return null;
    }

    const plain = user.get({ plain: true }) as {
      roles?: Array<{ name: string; permissions?: Array<{ name: string }> }>;
    };
    const snapshot: UserAccessSnapshot = {
      roles: new Set<string>(),
      permissions: new Set<string>(),
    };

    for (const role of plain.roles ?? []) {
      snapshot.roles.add(role.name);
      for (const permission of role.permissions ?? []) {
        snapshot.permissions.add(permission.name);
      }
    }

    if (ttlMs > 0) {
      this.cache.set(userId, { snapshot, expiresAt: now + ttlMs });
    }
    return snapshot;
  }

  invalidateUser(userId: number): void {
    this.cache.delete(userId);
  }

  clearAll(): void {
    this.cache.clear();
  }
}

export default new PermissionCacheService();
