import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ example: 'Transporte', description: 'Nome da tag' })
  name: string;

  @ApiProperty({ example: '#FF5733', description: 'Cor em formato hexadecimal (#RGB ou #RRGGBB)' })
  colorHex: string;
}
