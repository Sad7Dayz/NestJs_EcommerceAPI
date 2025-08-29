import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Roles } from '../user/decorator/user.decorator';
import { AuthGuard } from '../user/guard/Auth.guard';
import { CreateRequestProductDto } from './dto/create-request-product.dto';
import { UpdateRequestProductDto } from './dto/update-request-product.dto';
import { RequestProductService } from './request-product.service';

@Controller('v1/req-product')
export class RequestProductController {
  constructor(private readonly requestProductService: RequestProductService) {}

  @Post()
  @Roles(['user'])
  @UseGuards(AuthGuard)
  create(
    @Body(
      new ValidationPipe({
        forbidNonWhitelisted: false,
        whitelist: true,
      }),
    )
    createRequestProductDto: CreateRequestProductDto,
    @Req() req,
  ) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException();
    }
    return this.requestProductService.create({
      ...createRequestProductDto,
      user: req.user._id,
    });
  }

  @Get()
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  findAll() {
    return this.requestProductService.findAll();
  }

  @Get(':id')
  @Roles(['admin', 'user'])
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string, @Req() req) {
    return this.requestProductService.findOne(id, req);
  }

  @Patch(':id')
  @Roles(['user'])
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateRequestProductDto: UpdateRequestProductDto,
    @Req() req,
  ) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException();
    }

    return this.requestProductService.update(id, {
      ...updateRequestProductDto,
      user: req.user._id,
    });
  }

  @Delete(':id')
  @Roles(['user'])
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string, @Req() req) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException();
    }
    const user_id = req.user._id;
    return this.requestProductService.remove(id, user_id);
  }
}
