import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private readonly uploadDir: string;
  private readonly maxSize: number;
  private readonly allowedTypes: string[];

  constructor(private config: ConfigService) {
    this.uploadDir = this.config.get('UPLOAD_DIR', './uploads');
    this.maxSize = this.config.get('MAX_FILE_SIZE', 10485760);
    this.allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'audio/mpeg'];
    
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`📁 Создана папка: ${this.uploadDir}`);
    }
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    // Проверка размера
    if (file.size > this.maxSize) {
      throw new BadRequestException(`Файл слишком большой. Максимум: ${this.maxSize / 1024 / 1024}MB`);
    }

    // Проверка типа
    if (!this.allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Неподдерживаемый тип файла: ${file.mimetype}`);
    }

    // Генерация имени
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(this.uploadDir, filename);

    // Сохранение
    fs.writeFileSync(filepath, file.buffer);
    this.logger.log(`💾 Файл сохранен: ${filename}`);

    return `/uploads/${filename}`;
  }

  async deleteFile(url: string): Promise<void> {
    const filename = path.basename(url);
    const filepath = path.join(this.uploadDir, filename);
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      this.logger.log(`🗑️ Файл удален: ${filename}`);
    }
  }

  async getFile(filename: string): Promise<Buffer> {
    const filepath = path.join(this.uploadDir, filename);
    if (!fs.existsSync(filepath)) {
      throw new BadRequestException('Файл не найден');
    }
    return fs.readFileSync(filepath);
  }
}