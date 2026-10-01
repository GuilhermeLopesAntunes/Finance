import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateTagDto } from './dto/create-tag.dto.js';
import { UpdateTagDto } from './dto/update-tag.dto.js';
import { TagsService } from './tags.service.js';

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar tag' })
  @ApiResponse({ status: 201, description: 'Tag criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Cor hex inválida' })
  @ApiResponse({ status: 409, description: 'Tag com esse nome já existe' })
  create(@Body() dto: CreateTagDto) {
    return this.tagsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as tags' })
  @ApiResponse({ status: 200, description: 'Lista de tags' })
  findAll() {
    return this.tagsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar tag por ID' })
  @ApiResponse({ status: 200, description: 'Tag encontrada' })
  @ApiResponse({ status: 404, description: 'Tag não encontrada' })
  findOne(@Param('id') id: string) {
    return this.tagsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar tag' })
  @ApiResponse({ status: 200, description: 'Tag atualizada' })
  @ApiResponse({ status: 400, description: 'Cor hex inválida' })
  @ApiResponse({ status: 404, description: 'Tag não encontrada' })
  @ApiResponse({ status: 409, description: 'Nome já em uso' })
  update(@Param('id') id: string, @Body() dto: UpdateTagDto) {
    return this.tagsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover tag' })
  @ApiResponse({ status: 204, description: 'Tag removida' })
  @ApiResponse({ status: 404, description: 'Tag não encontrada' })
  @ApiResponse({ status: 409, description: 'Tag possui transações vinculadas' })
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }
}
