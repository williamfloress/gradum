import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Módulo Global que provee y exporta el PrismaService.
 * Al estar marcado como @Global(), una vez importado en AppModule,
 * PrismaService estará disponible en todos los demás módulos del
 * proyecto sin necesidad de importarlo manualmente en cada uno.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
