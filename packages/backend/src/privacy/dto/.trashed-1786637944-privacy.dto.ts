import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdatePrivacyDto {
  @IsOptional()
  @IsString()
  @IsIn(['EVERYONE', 'CONTACTS', 'NOBODY'])
  phoneVisibility?: string;

  @IsOptional()
  @IsString()
  @IsIn(['true', 'false'])
  forwardRestriction?: string;

  @IsOptional()
  @IsString()
  autoDeleteTimer?: string;

  @IsOptional()
  @IsString()
  @IsIn(['EVERYONE', 'CONTACTS', 'NOBODY'])
  lastSeen?: string;

  @IsOptional()
  @IsString()
  @IsIn(['EVERYONE', 'CONTACTS', 'NOBODY'])
  profilePhoto?: string;

  @IsOptional()
  @IsString()
  @IsIn(['EVERYONE', 'CONTACTS', 'NOBODY'])
  onlineStatus?: string;
}