import { JwtService } from '@nestjs/jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import { HelpersService } from 'src/helpers/helpers.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private helpersService: HelpersService,
    private configService: ConfigService,
  ) {}

  async registration(createUserDto: CreateUserDto) {
    const userToken = await this.userService.createUser(createUserDto);
    return userToken;
  }

  login(user: User) {
    const payload = { sub: user.id };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '30d' });
    const refreshToken = this.generateRefreshToken(payload);
    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      });

      const user = await this.userService.getUserById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Пользователь не найден');
      }

      const accessToken = this.jwtService.sign(
        { sub: user.id },
        { expiresIn: '30d' },
      );
      const newRefreshToken = this.generateRefreshToken({ sub: user.id });

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Недействительный refresh token');
    }
  }

  async validateUser(username: string, password: string) {
    const user = await this.userService.getUserByName(username);

    const passwordIdMatch = await this.helpersService.verifyPassword(
      user.password,
      password,
    );
    if (user && passwordIdMatch) {
      return {
        ...user,
        password: undefined,
        email: undefined,
      };
    }
    throw new UnauthorizedException('Некорректные поля Почта или Пароль');
  }

  generateRefreshToken(payload: any): string {
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      expiresIn: '7d',
    });
    return refreshToken;
  }
}
