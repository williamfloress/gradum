/**
 * Sprint 3 — ApprovedUserGuard en el controlador; rutas dedicadas listar pendientes y aprobar/rechazar por path.
 */
import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { ApprovedUserGuard } from '../auth/approved-user.guard';
import { RolesGuard, type JwtRequestUser } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminService } from './admin.service';
import { parseAdminUserAction } from './dto/admin-user-action.dto';

@Controller('admin')
@UseGuards(SupabaseAuthGuard, ApprovedUserGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('ping')
  ping() {
    return { ok: true, message: 'admin' };
  }

  /** GET /admin/usuarios/pendientes — solo filtro pendiente_aprobacion (orden FIFO). */
  @Get('usuarios/pendientes')
  listPendingUsers() {
    return this.adminService.listPendingUsers();
  }

  @Get('usuarios')
  listUsers() {
    return this.adminService.listUsers();
  }

  /** PATCH …/aprobar — equivalente a PATCH …/:id con { accion: 'aprobar' }. */
  @Patch('usuarios/:id/aprobar')
  approveUser(
    @Param('id') id: string,
    @Req() req: { user: JwtRequestUser },
  ) {
    return this.adminService.applyUserAction(req.user.userId, id, 'aprobar');
  }

  /** PATCH …/rechazar — equivalente a { accion: 'denegar' }. */
  @Patch('usuarios/:id/rechazar')
  rejectUser(
    @Param('id') id: string,
    @Req() req: { user: JwtRequestUser },
  ) {
    return this.adminService.applyUserAction(req.user.userId, id, 'denegar');
  }

  @Patch('usuarios/:id')
  patchUser(
    @Param('id') id: string,
    @Body() body: { accion?: unknown },
    @Req() req: { user: JwtRequestUser },
  ) {
    const accion = parseAdminUserAction(body?.accion);
    return this.adminService.applyUserAction(req.user.userId, id, accion);
  }
}