import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cho phép frontend (Next.js, cổng 3000) gọi API
  app.enableCors({ origin: 'http://localhost:3000', credentials: true });

  // Validate dữ liệu đầu vào toàn cục (dùng cho Task 6)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Cổng 3001 để không trùng với frontend (3000)
  await app.listen(process.env.PORT ?? 3001);
}

bootstrap();
