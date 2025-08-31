import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../user/decorator/user.decorator';
import { AuthGuard } from '../user/guard/Auth.guard';
import { CreateTexDto } from './dto/create-tex.dto';
import { TexService } from './tex.service';

@Controller('v1/tex')
export class TexController {
  constructor(private readonly texService: TexService) {}

  @Post()
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  create(@Body() createTexDto: CreateTexDto) {
    return this.texService.createOrUpdate(createTexDto);
  }

  @Get()
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  find() {
    return this.texService.find();
  }

  @Delete()
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  reSet() {
    return this.texService.reSet();
  }
}
