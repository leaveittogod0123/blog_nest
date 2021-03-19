import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'admin',
  CHIEFEDITOR = 'chiefeditor',
  EDITOR = 'editor',
  USER = 'user',
}

export class UserDto {
  @ApiProperty({ description: '회원 ID' })
  id?: string;
  @ApiProperty({ description: '회원 닉넴' })
  name?: string;
  @ApiProperty({ description: '회원 이름' })
  username?: string;
  @ApiProperty({ description: '회원 이메일' })
  email?: string;
  @ApiProperty({ description: '회원 비밀번호' })
  password?: string;
  @ApiProperty({ description: '권한' })
  role?: UserRole;
}

export class PatchUserDto {
  @ApiProperty({ description: '권한' })
  role?: UserRole;
}
