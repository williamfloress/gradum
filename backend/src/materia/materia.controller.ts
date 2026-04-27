import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { MateriaService } from './materia.service';
import { CreateMateriaDto } from './dto/create-materia.dto';
import { UpdateMateriaDto } from './dto/update-materia.dto';
import { Roles } from '../auth/roles.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { ApprovedUserGuard } from '../auth/approved-user.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('pensum/:pensumId/materia')
@UseGuards(SupabaseAuthGuard, ApprovedUserGuard, RolesGuard)
export class MateriaController {
  constructor(private readonly materiaService: MateriaService) { }

  @Post()
  @Roles('admin')
  create(@Param('pensumId') pensumId: string, @Body() createMateriaDto: CreateMateriaDto) {
    return this.materiaService.create(pensumId, createMateriaDto);
  }

  @Get()
  findAll(@Param('pensumId') pensumId: string) {
    return this.materiaService.findAll(pensumId);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateMateriaDto: UpdateMateriaDto) {
    return this.materiaService.update(id, updateMateriaDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.materiaService.remove(id);
  }
}
