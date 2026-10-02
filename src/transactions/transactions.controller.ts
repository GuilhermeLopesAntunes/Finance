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
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { FilterTransactionsDto } from './dto/filter-transactions.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { TransactionsService } from './transactions.service.js';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar transação (gasto ou ganho)' })
  @ApiResponse({ status: 201, description: 'Transação registrada' })
  @ApiResponse({ status: 400, description: 'Tipo inválido ou data mal formatada' })
  @ApiResponse({ status: 404, description: 'Tag não encontrada' })
  create(@Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar transações com filtros opcionais' })
  @ApiResponse({ status: 200, description: 'Lista de transações com tag associada' })
  findAll(@Query() filters: FilterTransactionsDto) {
    return this.transactionsService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar transação por ID' })
  @ApiResponse({ status: 200, description: 'Transação com dados da tag' })
  @ApiResponse({ status: 404, description: 'Transação não encontrada' })
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar transação' })
  @ApiResponse({ status: 200, description: 'Transação atualizada' })
  @ApiResponse({ status: 400, description: 'Tipo inválido ou data mal formatada' })
  @ApiResponse({ status: 404, description: 'Transação ou tag não encontrada' })
  update(@Param('id') id: string, @Body() dto: UpdateTransactionDto) {
    return this.transactionsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover transação' })
  @ApiResponse({ status: 204, description: 'Transação removida' })
  @ApiResponse({ status: 404, description: 'Transação não encontrada' })
  remove(@Param('id') id: string) {
    return this.transactionsService.remove(id);
  }
}
