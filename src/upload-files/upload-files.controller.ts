import {
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Roles } from '../user/decorator/user.decorator';
import { AuthGuard } from '../user/guard/Auth.guard';
import { UploadFilesService } from './upload-files.service';

@Controller('v1/image')
export class UploadFilesController {
  constructor(private readonly uploadFilesService: UploadFilesService) {}

  @Get('test')
  async test(@I18n() i18n: I18nContext) {
    return await i18n.t('dto.HELLO');
  }

  @Post('upload')
  @Roles(['admin', 'user'])
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 5000000,
            message: 'File is too large must be less than 5MB',
          }),
          new FileTypeValidator({ fileType: 'image/png' }),
        ],
      }),
    )
    file: any,
  ) {
    return this.uploadFilesService.uploadFile(file);
  }

  @Post('uploads')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('files[]', 5))
  uploadImages(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 5000000,
            message: 'File is too large must be less than 5MB',
          }),
          new FileTypeValidator({ fileType: 'image/png' }),
        ],
      }),
    )
    files: any,
  ) {
    return this.uploadFilesService.uploadFiles(files);
  }
}
