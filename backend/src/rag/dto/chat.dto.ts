import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ChatDto {
  @IsString()
  @MinLength(1, { message: 'question is required' })
  @MaxLength(2000, { message: 'question must be 2000 characters or fewer' })
  question!: string;

  @IsOptional()
  @IsUUID('4', { message: 'conversationId must be a valid id' })
  conversationId?: string;
}
