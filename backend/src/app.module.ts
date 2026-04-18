import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { SupabaseModule } from './supabase/supabase.module';
import { DegreeModule } from './degree/degree.module';
import { PensumModule } from './pensum/pensum.module';
import { MateriaModule } from './materia/materia.module';
import { PrerrequisitosModule } from './prerrequisitos/prerrequisitos.module';
import { PerfilesModule } from './perfiles/perfiles.module';
import { InscripcionesModule } from './inscripciones/inscripciones.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AdminModule,
    SupabaseModule,
    DegreeModule,
    PensumModule,
    MateriaModule,
    PrerrequisitosModule,
    PerfilesModule,
    InscripcionesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
