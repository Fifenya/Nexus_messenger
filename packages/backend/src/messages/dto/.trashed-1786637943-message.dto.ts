import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class SendMessageDto {
  @IsString()
  chatId: string;

  @IsString()
  text: string;

  @IsOptional()
  @IsString()
  replyToId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deleteTimer?: number;
}

export class GetMessagesDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 50;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}