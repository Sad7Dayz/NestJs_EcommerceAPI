import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../user/decorator/user.decorator';
import { AuthGuard } from '../user/guard/Auth.guard';
import { CreateTaxDto } from './dto/create-tax.dto';
import { TaxService } from './tax.service';

@Controller('v1/tax')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Post()
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  create(@Body() createTaxDto: CreateTaxDto) {
    return this.taxService.createOrUpdate(createTaxDto);
  }

  @Get()
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  find() {
    return this.taxService.find();
  }

  @Delete()
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  reSet() {
    return this.taxService.reSet();
  }
}
