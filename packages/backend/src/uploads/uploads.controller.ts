import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const ALLOWED_MIME = /^(image\/|video\/|audio\/)/;
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          cb(null, `${randomUUID()}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: MAX_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.test(file.mimetype)) {
          return cb(new BadRequestException('Only image, video, or audio files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    const type = file.mimetype.startsWith('image/')
      ? 'image'
      : file.mimetype.startsWith('video/')
        ? 'video'
        : 'voice';

    return {
      url: `/uploads/${file.filename}`,
      type,
      size: file.size,
      mimeType: file.mimetype,
    };
  }
}
