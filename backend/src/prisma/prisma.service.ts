import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * Servicio encargado de gestionar la conexión con la base de datos a través de Prisma.
 * Usamos el adaptador PrismaPg para evitar errores de motor nativo (WASM/Library) en Node.js.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  public readonly prisma: PrismaClient;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    console.log('[PrismaService] Initializing with PrismaPg adapter...');

    // Configuración del pool de conexiones de 'pg'
    const pool = new Pool({ connectionString });

    // Adaptador de Prisma para PostgreSQL (Driver JavaScript)
    const adapter = new PrismaPg(pool as any);

    this.prisma = new PrismaClient({
      adapter,
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  /**
   * Se ejecuta al iniciar el módulo. Establece la conexión.
   */
  async onModuleInit(): Promise<void> {
    return await this.prisma.$connect();
  }

  /**
   * Se ejecuta al destruir el módulo. Cierra la conexión de forma segura.
   */
  async onModuleDestroy(): Promise<void> {
    return await this.prisma.$disconnect();
  }

  /**
   * Acceso directo al modelo usuario para mantener compatibilidad con AuthService
   */
  get usuario(): any {
    return this.prisma.usuario;
  }

  /**
   * Acceso directo al modelo carrera (referenciado como degree en el código)
   */
  get degree(): any {
    return this.prisma.carrera;
  }

  /**
   * Acceso directo al modelo pensum
   */
  get pensum(): any {
    return this.prisma.pensum;
  }

  /**
   * Acceso directo al modelo materia
   */
  get materia(): any {
    return this.prisma.materia;
  }

  /**
   * Acceso directo al modelo prerrequisito
   */
  get prerrequisito(): any {
    return this.prisma.prerrequisito;
  }
}
