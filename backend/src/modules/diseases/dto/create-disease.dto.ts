import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateDiseaseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
