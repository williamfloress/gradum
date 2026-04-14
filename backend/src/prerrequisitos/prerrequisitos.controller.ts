import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { ApprovedUserGuard } from '../auth/approved-user.guard';
import { RolesGuard } from '../auth/roles.guard';
import { PrerrequisitosService } from './prerrequisitos.service';
import { CreatePrerrequisitoDto } from './dto/create-prerrequisito.dto';
import { UpdatePrerrequisitoDto } from './dto/update-prerrequisito.dto';

@Controller('materias/:materiaId/prerrequisitos')
@Roles('admin')
@UseGuards(SupabaseAuthGuard, ApprovedUserGuard, RolesGuard)
export class PrerrequisitosController {
  constructor(private readonly prerrequisitosService: PrerrequisitosService) { }

  @Post()
  create(
    @Param('materiaId') materiaId: string,
    @Body() createPrerrequisitoDto: CreatePrerrequisitoDto,
  ) {
    return this.prerrequisitosService.create(
      materiaId,
      createPrerrequisitoDto.materiaPrerrequisitoId,
    );
  }

  @Get()
  findAll(@Param('materiaId') materiaId: string) {
    return this.prerrequisitosService.findAll(materiaId);
  }

  @Patch(':materiaPrerrequisitoId')
  update(
    @Param('materiaId') materiaId: string,
    @Param('materiaPrerrequisitoId') materiaPrerrequisitoId: string,
    @Body() updatePrerrequisitoDto: UpdatePrerrequisitoDto,
  ) {
    return this.prerrequisitosService.update(
      materiaId,
      materiaPrerrequisitoId,
      updatePrerrequisitoDto,
    );
  }

  @Delete(':materiaPrerrequisitoId')
  remove(
    @Param('materiaId') materiaId: string,
    @Param('materiaPrerrequisitoId') materiaPrerrequisitoId: string,
  ) {
    return this.prerrequisitosService.remove(materiaId, materiaPrerrequisitoId);
  }
}
