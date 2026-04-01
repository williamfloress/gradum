import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { SupabaseAuthGuard } from './supabase-auth.guard';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
  ],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard, SupabaseAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, RolesGuard, SupabaseAuthGuard],
})
export class AuthModule {}
