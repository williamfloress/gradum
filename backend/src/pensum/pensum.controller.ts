/** Sprint 3 — ApprovedUserGuard: solo estudiantes aprobados (y admin) usan el API académico. */
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { ApprovedUserGuard } from '../auth/approved-user.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PensumService } from './pensum.service';
import { CreatePensumDto } from './dto/create-pensum.dto';
import { UpdatePensumDto } from './dto/update-pensum.dto';

@Controller()
@UseGuards(SupabaseAuthGuard, ApprovedUserGuard, RolesGuard)
export class PensumController {
  constructor(private readonly pensumService: PensumService) {}

  @Get('degree/:degreeId/pensum')
  findAllByDegree(@Param('degreeId') degreeId: string) {
    return this.pensumService.findAllByDegree(degreeId);
  }

  @Get('pensum/:id')
  findOne(@Param('id') id: string) {
    return this.pensumService.findOne(id);
  }

  @Post('degree/:degreeId/pensum')
  @Roles('admin')
  create(@Param('degreeId') degreeId: string, @Body() dto: CreatePensumDto) {
    return this.pensumService.create(degreeId, dto);
  }

  @Patch('pensum/:id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdatePensumDto) {
    return this.pensumService.update(id, dto);
  }

  @Delete('pensum/:id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.pensumService.remove(id);
  }
}
