import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  email!: string;

  @IsString()
  @MinLength(2, { message: 'fullName must be at least 2 characters' })
  @MaxLength(80)
  fullName!: string;

  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @MaxLength(128)
  password!: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  email!: string;

  @IsString()
  @MinLength(1, { message: 'password is required' })
  password!: string;
}

export class RefreshDto {
  @IsString()
  @MinLength(1, { message: 'refreshToken is required' })
  refreshToken!: string;
}
