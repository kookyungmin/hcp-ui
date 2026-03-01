export const PERMISSIONS = {
  SERVER_INSTANCE_READ: "server:instance:read",
  SERVER_INSTANCE_EXECUTE: "server:instance:execute",
  SERVER_INSTANCE_WRITE: "server:instance:write"
} as const;

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
