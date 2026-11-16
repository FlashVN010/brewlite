import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateVnpayPaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string; // Mã đơn dạng ORD-yyyyMMdd-xxxx

  // Bỏ trống để khách chọn phương thức ngay trên trang VNPAY
  @IsOptional()
  @IsString()
  @IsIn(['VNPAYQR', 'VNBANK', 'INTCARD'])
  bankCode?: 'VNPAYQR' | 'VNBANK' | 'INTCARD';
}
