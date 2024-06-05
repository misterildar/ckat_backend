import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, ForbiddenException } from '@nestjs/common';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { HelpersService } from 'src/helpers/helpers.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private helpersService: HelpersService,
    private configService: ConfigService,
  ) {}

  async getMe(user: User) {
    const existUser = await this.getUserById(user.id);
    this.deletePassword(existUser);
    return existUser;
  }

  async updateMe(id: number, updateUserDto: UpdateUserDto) {
    const { username, email, password } = updateUserDto;
    if (username) {
      const existUserName = await this.findOne({
        where: { username },
      });
      if (existUserName) {
        throw new ForbiddenException(
          'Такое имя уже существует, выберите пожалуйста другое',
        );
      }
    }
    if (email) {
      const existUserEmail = await this.findOne({
        where: { email },
      });
      if (existUserEmail) {
        throw new ForbiddenException(
          'Такой email уже существует, выберите пожалуйста другой',
        );
      }
    }
    if (password) {
      updateUserDto.password = await this.helpersService.hashPassword(password);
    }
    await this.userRepository.update(id, updateUserDto);
    const { ...updateUserData } = await this.findOne({ where: { id } });
    this.deletePassword(updateUserData);
    return updateUserData;
  }

  async getUserByName(username: string) {
    return await this.findOne({ where: { username } });
  }

  async getUserByEmail(email: string) {
    return await this.findOne({ where: { email } });
  }

  async getUserById(id: number) {
    return await this.findOne({ where: { id } });
  }

  async createUser(createUserDto: CreateUserDto) {
    const { username, email, password } = createUserDto;
    const existEmail = await this.findOne({ where: { email } });
    if (existEmail) {
      throw new ForbiddenException('Пользователь с таким email уже существует');
    }
    const existUserName = await this.findOne({ where: { username } });
    if (existUserName) {
      throw new ForbiddenException(
        'Пользователь с таким именем уже существует',
      );
    }
    const hachPassword = await this.helpersService.hashPassword(password);
    const user = await this.userRepository.save({
      ...createUserDto,
      password: hachPassword,
    });
    const tokens = this.generateToken(user);
    return tokens;
  }

  private generateToken(user: User) {
    const { email, id, username } = user;
    const payload = { email, id, username };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: this.configService.get('REFRESH_TOKEN_SECRET'),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  findOne(query: FindOneOptions<User>) {
    return this.userRepository.findOne(query);
  }

  findMany(query: FindManyOptions<User>) {
    return this.userRepository.find(query);
  }

  deletePassword(user: User) {
    delete user.password;
    return user;
  }
}
