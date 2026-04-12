import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { ApprovedUserGuard } from '../auth/approved-user.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DegreeService } from './degree.service';
import { CreateDegreeDto } from './dto/create-degree.dto';
import { UpdateDegreeDto } from './dto/update-degree.dto';

@Controller('degree')
@UseGuards(SupabaseAuthGuard, ApprovedUserGuard, RolesGuard)
export class DegreeController {
  constructor(private readonly degreeService: DegreeService) {}

  @Get()
  listDegrees() {
    return this.degreeService.findAll();
  }

  @Get(':id')
  getDegree(@Param('id') id: string) {
    return this.degreeService.findOne(id);
  }

  @Post()
  @Roles('admin')
  createDegree(@Body() dto: CreateDegreeDto) {
    return this.degreeService.create(dto);
  }

  @Patch(':id')
  @Roles('admin')
  updateDegree(@Param('id') id: string, @Body() dto: UpdateDegreeDto) {
    return this.degreeService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  removeDegree(@Param('id') id: string) {
    return this.degreeService.remove(id);
  }
}
