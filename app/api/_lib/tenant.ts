export function scopeToOrganization(where: any, user: any, orgField: string = "organizationId") {
  if (user.role === "super_admin" || user.role === "SUPER_ADMIN") {
    return where;
  }

  if (!user.organizationId) {
    return { ...where, [orgField]: "" };
  }

  return { ...where, [orgField]: user.organizationId };
}
