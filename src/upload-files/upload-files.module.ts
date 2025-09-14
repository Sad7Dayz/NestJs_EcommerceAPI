import { Module } from '@nestjs/common';
import { CloudinaryProvider } from './cloudinary.provider';
import { UploadFilesController } from './upload-files.controller';
import { UploadFilesService } from './upload-files.service';

@Module({
  controllers: [UploadFilesController],
  providers: [UploadFilesService, CloudinaryProvider],
  exports: [UploadFilesService, CloudinaryProvider],
})
export class UploadFilesModule {}
