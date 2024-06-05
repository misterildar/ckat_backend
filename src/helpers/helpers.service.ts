import * as argon2 from 'argon2';
import { Injectable } from '@nestjs/common';

@Injectable()
export class HelpersService {
  async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password);
  }
  async verifyPassword(
    userPassword: string,
    password: string,
  ): Promise<boolean> {
    return await argon2.verify(userPassword, password);
  }
}
