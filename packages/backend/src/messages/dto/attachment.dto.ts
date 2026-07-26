import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AttachmentDto {
  @IsIn(['image', 'video', 'voice', 'file'])
  type: 'image' | 'video' | 'voice' | 'file';

  @IsString()
  url: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  size?: number;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;
}
