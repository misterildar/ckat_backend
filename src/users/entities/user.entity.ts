import { Length, IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { Entity, Column } from 'typeorm';

import { BaseEntity } from 'src/utils/base-entity';

@Entity()
export class User extends BaseEntity {
  @Column({ unique: true })
  @IsString()
  @IsNotEmpty()
  @Length(2, 30)
  username: string;

  @Column({ unique: true })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  password: string;
}
