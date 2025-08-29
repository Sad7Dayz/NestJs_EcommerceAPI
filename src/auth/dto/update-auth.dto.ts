import { PartialType } from '@nestjs/mapped-types';
import { SignupDto } from './auth.dto';

export class UpdateUserDto extends PartialType(SignupDto) {}
