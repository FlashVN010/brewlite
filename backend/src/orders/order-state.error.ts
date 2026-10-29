import { BadRequestException } from '@nestjs/common';

export class InvalidTransitionError extends BadRequestException {
  constructor(from: string, to: string) {
    super(`Không thể chuyển trạng thái đơn hàng từ "${from}" sang "${to}"`);
  }
}