import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsIn(['WALLET', 'CARD'])
  method: 'WALLET' | 'CARD';
}