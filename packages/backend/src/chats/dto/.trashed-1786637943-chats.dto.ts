import { IsString, IsOptional, IsArray, IsEnum, MaxLength } from 'class-validator';

export class CreateChatDto {
  @IsOptional()
  @IsEnum(['PRIVATE', 'GROUP'])
  type?: 'PRIVATE' | 'GROUP';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];
}

export class UpdateChatDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class AddMembersDto {
  @IsArray()
  @IsString({ each: true })
  userIds: string[];
}