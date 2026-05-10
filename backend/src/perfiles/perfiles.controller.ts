import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { ApprovedUserGuard } from '../auth/approved-user.guard';
import { PerfilesService } from './perfiles.service';
import { CreatePerfilDto } from './dto/create-perfil.dto';

@Controller('perfiles')
@UseGuards(SupabaseAuthGuard, ApprovedUserGuard)
export class PerfilesController {
  constructor(private readonly perfilesService: PerfilesService) {}

  /**
   * POST /perfiles
   * Crea el perfil del estudiante autenticado.
   * Solo accesible por usuarios con estado 'aprobado' (ApprovedUserGuard).
   * No requiere rol admin: cualquier estudiante aprobado puede crear su perfil.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: any, @Body() dto: CreatePerfilDto) {
    return this.perfilesService.create(req.user.userId, dto);
  }

  /**
   * GET /perfiles/me
   * Retorna el perfil del estudiante autenticado.
   * El frontend usa este endpoint para saber si debe mostrar el onboarding.
   * Devuelve 404 si el usuario aún no tiene perfil.
   */
  @Get('me')
  async getMe(@Req() req: any) {
    const perfil = await this.perfilesService.getMiPerfil(req.user.userId);
    if (!perfil) {
      throw new NotFoundException('El usuario aún no tiene un perfil creado');
    }
    return perfil;
  }

  /**
   * GET /perfiles/mi-pensum
   * Retorna el pensum completo del estudiante estructurado por semestres,
   * incluyendo el estado de cada materia según sus inscripciones.
   */
  @Get('mi-pensum')
  getMiPensum(@Req() req: any) {
    return this.perfilesService.getMiPensum(req.user.userId);
  }

  /**
   * GET /perfiles/calendario
   * Retorna todas las evaluaciones con fecha límite del estudiante,
   * listas para renderizar en el calendario del frontend.
   */
  @Get('calendario')
  getCalendario(@Req() req: any) {
    return this.perfilesService.getCalendario(req.user.userId);
  }
}
