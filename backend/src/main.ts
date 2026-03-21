import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // El puerto también se toma de .env si existe, si no usa 3000
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
