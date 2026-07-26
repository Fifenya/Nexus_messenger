import { IsString, IsOptional, IsBoolean, IsObject, MaxLength } from 'class-validator';

export class CreateThemeDto {
  @IsString()
  @MaxLength(50)
  name: string;

  @IsObject()
  variables: Record<string, string>;

  @IsOptional()
  @IsObject()
  colors?: Record<string, string>;

  @IsOptional()
  @IsString()
  wallpaperUrl?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateThemeDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;

  @IsOptional()
  @IsObject()
  colors?: Record<string, string>;

  @IsOptional()
  @IsString()
  wallpaperUrl?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}