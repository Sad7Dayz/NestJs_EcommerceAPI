import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateCartItemsDto {
  @IsOptional()
  @IsNumber({}, { message: 'quantity must be a number' })
  @Min(1, { message: 'quantity must be at least 1' })
  quantity: number;

  @IsOptional()
  @IsString({ message: 'color must be a string' })
  color: string;
}
