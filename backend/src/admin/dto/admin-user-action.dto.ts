import { BadRequestException } from '@nestjs/common';

export type AdminUserAction = 'aprobar' | 'denegar' | 'banear';

export function parseAdminUserAction(raw: unknown): AdminUserAction {
  if (raw === 'aprobar' || raw === 'denegar' || raw === 'banear') {
    return raw;
  }
  throw new BadRequestException('accion debe ser: aprobar, denegar o banear');
}
