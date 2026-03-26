import { SetMetadata } from '@nestjs/common';
import { Rol } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Restringe el endpoint a uno o más valores de `Rol` (requiere `JwtAuthGuard` + `RolesGuard`). */
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);
