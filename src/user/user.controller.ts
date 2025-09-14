import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Roles } from './decorator/user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from './guard/Auth.guard';
import { UserService } from './user.service';

@Controller('v1/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  create(
    @Body(new ValidationPipe({ forbidNonWhitelisted: true }))
    createUserDto: CreateUserDto,
    @I18n() i18n: I18nContext,
  ) {
    return this.userService.create(createUserDto, i18n);
  }

  @Get()
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  findAll(@Query() query, @I18n() i18n: I18nContext) {
    return this.userService.findAll(query, i18n);
  }

  @Get(':id')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string, @I18n() i18n: I18nContext) {
    return this.userService.findOne(id, i18n);
  }

  @Patch(':id')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ forbidNonWhitelisted: true }))
    updateUserDto: UpdateUserDto,
    @I18n() i18n: I18nContext,
  ) {
    return this.userService.update(id, updateUserDto, i18n);
  }

  @Delete(':id')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string, @I18n() i18n: I18nContext) {
    return this.userService.remove(id, i18n);
  }

  // @Get('me')
  // @Roles(['user', 'admin'])
  // @UseGuards(AuthGuard)
  // getMe(@Req() req) {
  //   return this.userService.getMe(req.user);
  // }
}

@Controller('v1/userMe')
export class UserMeController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(['user', 'admin'])
  @UseGuards(AuthGuard)
  getMe(@Req() req, @I18n() i18n: I18nContext) {
    return this.userService.getMe(req.user, i18n);
  }

  @Put()
  @Patch()
  @Roles(['user', 'admin'])
  @UseGuards(AuthGuard)
  updateMe(
    @Req() req,
    @Body(new ValidationPipe({ forbidNonWhitelisted: true }))
    updateUserDto: UpdateUserDto,
    @I18n() i18n: I18nContext,
  ) {
    return this.userService.updateMe(req.user, updateUserDto, i18n);
  }

  @Delete()
  @Roles(['user'])
  @UseGuards(AuthGuard)
  deleteMe(@Req() req, @I18n() i18n: I18nContext) {
    return this.userService.deleteMe(req.user, i18n);
  }
}
