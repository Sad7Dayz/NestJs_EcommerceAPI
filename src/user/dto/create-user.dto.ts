import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateUserDto {
  //name
  @IsString({ message: i18nValidationMessage('dto.IS_STRING') })
  @MinLength(3, {
    message: i18nValidationMessage('dto.MIN_LENGTH', { min: 3 }),
  })
  @MaxLength(30, {
    message: i18nValidationMessage('dto.MAX_LENGTH', { max: 30 }),
  })
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

  //role
  @IsEnum(['user', 'admin'], { message: 'role must be user or admin' })
  @MinLength(0, { message: 'Thie role must be required!' })
  @IsOptional()
  role: string;

  //avatar
  @IsString({ message: 'avatar Must be a string' })
  @IsUrl({}, { message: 'avatar must be a valid url' })
  @IsOptional()
  avatar: string;

  //age
  @IsNumber({}, { message: 'age Must be a number' })
  @IsOptional()
  age: number;

  @IsString({ message: 'phoneNumber Must be a string' })
  @IsPhoneNumber('EG', { message: 'phoneNumber must be a valid phone number' })
  @IsOptional()
  phoneNumber: string;

  //address
  @IsString({ message: 'address Must be a string' })
  @IsOptional()
  address: string;

  @IsBoolean({ message: 'active Must be a boolean' })
  @IsEnum([true, false], { message: 'active must be false or true' })
  @IsOptional()
  active: boolean;

  @IsString({ message: 'verificationCode Must be a string' })
  @IsOptional()
  @Length(6, 6, { message: 'verificationCode must be 6 characters' })
  verificationCode: string;

  @IsEnum(['male', 'female'], { message: 'gender must be true or false' })
  @IsOptional()
  gender: string;
}
