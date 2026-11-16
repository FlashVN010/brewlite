import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export type ProductSize = 'S' | 'M' | 'L';

export class CreateOrderItemDto {
  @IsInt()
  @IsPositive()
  productId: number;

  @IsEnum(['S', 'M', 'L'], { message: 'size phải là S, M hoặc L' })
  size: ProductSize;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  toppings?: string[];

  @IsInt()
  @Min(1, { message: 'quantity phải lớn hơn 0' }) // AC4
  quantity: number;
}

export class CreateOrderDto {
  @IsArray({ message: 'items phải là mảng' })
  @ArrayMinSize(1, { message: 'items không được rỗng' }) // AC2
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
  @IsOptional()
  @IsString()
  promoCode?: string;
}