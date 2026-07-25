import { db } from "@gbam/database/client";
import { Prisma } from "@gbam/database";
import {
  DEFAULT_PERMISSION_RULES,
  PROTECTED_PATHS,
  normalizeStoredPermissionConfig,
  type PermissionRule,
  type UserPermissionConfig,
} from "@gbam/shared";

export type PermissionsData = {
  permissionConfig: PermissionRule[]; // effective rules for display
  protectedPaths: string[]; // user-added custom paths (editable in the UI)
  builtInProtectedPaths: string[]; // hardcoded, display-only, never editable
  isCustom: boolean;
};

export async function getPermissionsData(userId: string): Promise<PermissionsData> {
  const settings = await db.userSettings.findUnique({
    where: { userId },
    select: { permissionConfig: true },
  });

  const normalized = normalizeStoredPermissionConfig(settings?.permissionConfig);

  return {
    permissionConfig: normalized?.rules?.length ? normalized.rules : DEFAULT_PERMISSION_RULES,
    protectedPaths: normalized?.protectedPaths ?? [],
    builtInProtectedPaths: PROTECTED_PATHS,
    isCustom: settings?.permissionConfig != null,
  };
}

export async function updatePermissionsData(
  userId: string,
  input: { permissionConfig: PermissionRule[] | null; protectedPaths: string[] | null },
): Promise<void> {
  const previous = await db.userSettings.findUnique({
    where: { userId },
    select: { permissionConfig: true },
  });

  // Both null together means "reset to defaults" -> clear the column entirely
  const isReset = input.permissionConfig === null && input.protectedPaths === null;

  const newStored: UserPermissionConfig | null = isReset
    ? null
    : { rules: input.permissionConfig ?? [], protectedPaths: input.protectedPaths ?? [] };

  const newConfigValue = newStored === null ? Prisma.JsonNull : (newStored as Prisma.InputJsonValue);
  const previousConfigValue =
    previous?.permissionConfig == null ? Prisma.JsonNull : (previous.permissionConfig as Prisma.InputJsonValue);

  await db.$transaction([
    db.userSettings.upsert({
      where: { userId },
      create: { userId, permissionConfig: newConfigValue },
      update: { permissionConfig: newConfigValue },
    }),
    db.permissionAuditLog.create({
      data: { userId, previousConfig: previousConfigValue, newConfig: newConfigValue },
    }),
  ]);
}