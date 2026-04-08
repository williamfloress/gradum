import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private clientInstance?: SupabaseClient;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      const msg =
        'Falta configurar SUPABASE_URL y/o SUPABASE_ANON_KEY. ' +
        'Sin estas variables no es posible autenticar solicitudes (login/guards).';
      this.logger.error(msg);
      throw new Error(msg);
    }

    this.clientInstance = createClient(supabaseUrl, supabaseKey);
    this.logger.log('Cliente de Supabase inicializado correctamente');
  }

  get client() {
    if (!this.clientInstance) {
      throw new Error(
        'Supabase no está configurado (cliente no inicializado). Verifica SUPABASE_URL y SUPABASE_ANON_KEY.',
      );
    }
    return this.clientInstance;
  }
}
