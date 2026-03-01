export const PERMISSIONS = {
  SERVER_INSTANCE_READ: "server:instance:read",
  SERVER_INSTANCE_EXECUTE: "server:instance:execute",
  SERVER_INSTANCE_WRITE: "server:instance:write"
} as const;

export type PermissionAction = "read" | "execute" | "write";

const LEGACY_SERVICE_PERMISSION_ALIASES: Record<string, string[]> = {
  "compute:server:read": [PERMISSIONS.SERVER_INSTANCE_READ],
  "compute:server:execute": [PERMISSIONS.SERVER_INSTANCE_EXECUTE],
  "compute:server:write": [PERMISSIONS.SERVER_INSTANCE_WRITE]
};

export function getServicePermission(categoryId: string, serviceId: string, action: PermissionAction) {
  return `${categoryId}:${serviceId}:${action}`;
}

export function hasServicePermission(
  roles: string[] | null | undefined,
  categoryId: string,
  serviceId: string,
  action: PermissionAction
) {
  const requiredPermission = getServicePermission(categoryId, serviceId, action);
  const aliases = LEGACY_SERVICE_PERMISSION_ALIASES[requiredPermission] ?? [];
  return [requiredPermission, ...aliases].some((permission) => hasRolePermission(roles, permission));
}

export function hasRolePermission(roles: string[] | null | undefined, requiredPermission: string) {
  if (!roles || roles.length === 0) {
    return false;
  }

  return roles.some((role) => {
    if (!role) return false;
    if (role === "*" || role === "admin") return true;
    if (role === requiredPermission) return true;

    if (role.endsWith(":*")) {
      const prefix = role.slice(0, -2);
      return requiredPermission.startsWith(`${prefix}:`);
    }

    return false;
  });
}
