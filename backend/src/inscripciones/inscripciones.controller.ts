import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { InscripcionesService } from './inscripciones.service';
import { CreateInscripcioneDto } from './dto/create-inscripcione.dto';
import { UpdateInscripcioneDto } from './dto/update-inscripcione.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { ApprovedUserGuard } from '../auth/approved-user.guard';

@Controller('inscripciones')
@UseGuards(SupabaseAuthGuard, ApprovedUserGuard)
export class InscripcionesController {
  constructor(private readonly inscripcionesService: InscripcionesService) {}

  @Post()
  create(@Req() req: any, @Body() createInscripcioneDto: CreateInscripcioneDto) {
    return this.inscripcionesService.create(req.user.userId, createInscripcioneDto);
  }

  @Get()
  findAll(@Req() req: any, @Query('semestre') semestre: string) {
    return this.inscripcionesService.findAll(req.user.userId, semestre);
  }

  @Get('disponibles')
  getDisponibles(@Req() req: any, @Query('semestre') semestre: string) {
    return this.inscripcionesService.getMateriasDisponibles(req.user.userId, semestre);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.inscripcionesService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() updateInscripcioneDto: UpdateInscripcioneDto) {
    return this.inscripcionesService.update(req.user.userId, id, updateInscripcioneDto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.inscripcionesService.remove(req.user.userId, id);
  }
}
