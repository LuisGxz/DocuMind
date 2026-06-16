import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const REQUIRE_ROLE_KEY = 'requireRole';

/**
 * Restrict a route to members holding one of the given workspace roles.
 * Used with WorkspaceAccessGuard, which resolves the caller's membership.
 * Omit the decorator to allow any member of the workspace.
 */
export const RequireRole = (...roles: Role[]) =>
  SetMetadata(REQUIRE_ROLE_KEY, roles);
