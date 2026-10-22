import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  loyaltyPoints: number;
}

@Injectable()
export class UsersService {
  private users: User[] = [];
  private idCounter = 1;

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find((u) => u.email === email);
  }

  async findById(id: number): Promise<User | undefined> {
    return this.users.find((u) => u.id === id);
  }

  async create(email: string, password: string): Promise<Omit<User, 'passwordHash'>> {
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Băm mật khẩu bằng bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser: User = {
      id: this.idCounter++,
      email,
      passwordHash,
      loyaltyPoints: 0,
    };

    this.users.push(newUser);

    // Bỏ passwordHash trước khi trả về
    const { passwordHash: _, ...result } = newUser;
    return result;
  }
}