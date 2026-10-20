import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';

@Module({
  // Đọc file backend/.env vào process.env (PORT, JWT_SECRET, DATABASE_URL...)
  imports: [ConfigModule.forRoot({ isGlobal: true }), ProductsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
