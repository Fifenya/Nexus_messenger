import { IsArray, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AttachmentDto } from './attachment.dto';

export class CreateMessageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  text?: string;

  @IsOptional()
  @IsString()
  replyToId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}

