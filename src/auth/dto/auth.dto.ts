import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class SignupDto {
  //name
  @IsString({ message: 'Name Must be a string' })
  @MinLength(3, { message: 'Name must be at least 3 characters' })
  @MaxLength(30, { message: 'Name must be at most 30 characters' })
  name: string;

  //Email
  @IsString({ message: 'Email Must be a string' })
  @MinLength(0, { message: 'Email must be Required' })
  @IsEmail({}, { message: 'Email is not a valid' })
  email: string;

  //password
  @IsString({ message: 'Password Must be a string' })
  @MinLength(3, { message: 'Password must be at least 3 characters' })
  //@MaxLength(30, { message: 'Password must be at most 30 characters' })
  password: string;
}

export class SignInDto {
  //Email
  @IsString({ message: 'Email Must be a string' })
  @MinLength(0, { message: 'Email must be Required' })
  @IsEmail({}, { message: 'Email is not a valid' })
  email: string;

  //password
  @IsString({ message: 'Password Must be a string' })
  @MinLength(3, { message: 'Password must be at least 3 characters' })
  //@MaxLength(30, { message: 'Password must be at most 30 characters' })
  password: string;
}

export class ResetPasswordDto {
  //Email
  @IsString({ message: 'Email Must be a string' })
  @MinLength(0, { message: 'Email must be Required' })
  @IsEmail({}, { message: 'Email is not a valid' })
  email: string;
}
