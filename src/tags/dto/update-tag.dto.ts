import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTagDto {
  @ApiPropertyOptional({ example: 'Lazer', description: 'Novo nome da tag' })
  name?: string;

  @ApiPropertyOptional({ example: '#28A745', description: 'Nova cor em formato hexadecimal' })
  colorHex?: string;
}
