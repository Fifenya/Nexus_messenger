import { ArrayMinSize, IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateChatDto {
  @IsIn(['PRIVATE', 'GROUP'])
  type: 'PRIVATE' | 'GROUP';

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  memberIds: string[];

  @IsOptional()
  @IsString()
  @MaxLength(64)
  title?: string;
}
