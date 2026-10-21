import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class QueryRequestDto {
  @IsNotEmpty({ message: 'The analytical prompt cannot be empty.' })
  @IsString({ message: 'The prompt must be a valid text string.' })
  @MaxLength(500, { message: 'The prompt cannot exceed 500 characters.' })
  prompt: string;
}
