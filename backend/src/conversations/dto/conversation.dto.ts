import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;
}

export class RenameConversationDto {
  @IsString()
  @MinLength(1, { message: 'title is required' })
  @MaxLength(120)
  title!: string;
}
