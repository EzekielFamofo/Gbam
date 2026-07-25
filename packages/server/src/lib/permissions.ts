import { db} from "@gbam/database/client";
import { Prisma } from "@gbam/database";
import { DEFAULT_PERMISSION_RULES, type PermissionRule } from "@gbam/shared";

export type PermissionsData = {
  permissionConfig: PermissionRule[];
  isCustom: boolean;
};

export async function getPermissionsData(userId: string): Promise<PermissionsData> {
  const settings = await db.userSettings.findUnique({
    where: { userId },
    select: { permissionConfig: true },
  });

  const rules = (settings?.permissionConfig as PermissionRule[] | null) ?? DEFAULT_PERMISSION_RULES;
  return { permissionConfig: rules, isCustom: settings?.permissionConfig != null };
}

export async function updatePermissionsData(
  userId: string,
  permissionConfig: PermissionRule[] | null,
): Promise<void> {
  const previous = await db.userSettings.findUnique({
    where: { userId },
    select: { permissionConfig: true },
  });

  const permissionConfigValue =
    permissionConfig === null ? Prisma.JsonNull : (permissionConfig as Prisma.InputJsonValue);
  const previousConfigValue =
    previous?.permissionConfig == null ? Prisma.JsonNull : (previous.permissionConfig as Prisma.InputJsonValue);

  await db.$transaction([
    db.userSettings.upsert({
      where: { userId },
      create: { userId, permissionConfig: permissionConfigValue },
      update: { permissionConfig: permissionConfigValue },
    }),
    db.permissionAuditLog.create({
      data: {
        userId,
        previousConfig: previousConfigValue,
        newConfig: permissionConfigValue,
      },
    }),
  ]);
}