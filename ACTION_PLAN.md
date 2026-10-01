# Plano de Ação: Sistema de Gestão Financeira com Tags Personalizadas

Documento de diretrizes e passos de implementação para desenvolvimento do sistema de registro de transações financeiras (gastos e ganhos) e gerenciamento de tags.

---

## 1. Visão Geral e Requisitos

### 1.1 Requisitos Funcionais (RF)
- **RF01 - Gerenciamento de Tags:**
  - Criar, listar, atualizar e deletar tags.
  - Cada tag deve conter um nome (ex: `Transporte`, `Lazer`, `Fixo`, `Extra`) e uma cor em hexadecimal (ex: `#FF5733`, `#28A745`).
  - Validação estrita de formato de cor HEX (`^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$`).
- **RF02 - Registro de Gastos (Despesas):**
  - Registrar despesa informando valor, descrição, data/hora e vínculo com uma tag existente (ex: `R$ 8,30` - `UBER` - Tag: `Transporte`).
- **RF03 - Registro de Ganhos (Receitas):**
  - Registrar receita informando valor, descrição, data/hora e vínculo com uma tag existente (ex: `R$ 1000,00` - `Estágio` - Tag: `Fixo`).
- **RF04 - Consulta e Histórico:**
  - Listar transações com filtro por tipo (`EXPENSE` / `INCOME`), tag e intervalo de data/hora.

### 1.2 Requisitos Não-Funcionais (RNF)
- **RNF01 - Precisão Financeira:** Armazenamento de valores monetários em inteiros (centavos) ou tipos decimais seguros para evitar erros de ponto flutuante.
- **RNF02 - Padronização Temporal:** Registro de data e hora em padrão ISO 8601 (UTC).
- **RNF03 - Arquitetura Limpa:** Separação entre Controllers, Services/Use Cases, Repositories e DTOs com validação de schema.

---

## 2. Modelo de Dados

### Entidade: `Tag`
```typescript
interface Tag {
  id: string;
  name: string;
  colorHex: string; // Ex: "#1E90FF"
  createdAt: Date;
  updatedAt: Date;
}
```

### Entidade: `Transaction`
```typescript
enum TransactionType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
}

interface Transaction {
  id: string;
  description: string;
  amountInCents: number; // Ex: 830 para R$ 8,30 / 100000 para R$ 1.000,00
  type: TransactionType;
  tagId: string;
  transactedAt: Date; // Data e hora do evento
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. Contratos de API (Endpoints & DTOs)

### 3.1 Tags (`/tags`)
- `POST /tags`: Criação de tag
  - **Body:** `{ "name": "Transporte", "colorHex": "#FF5733" }`
- `GET /tags`: Listagem de todas as tags
- `GET /tags/:id`: Detalhes de uma tag
- `PUT /tags/:id`: Atualização de nome e cor
- `DELETE /tags/:id`: Remoção de tag (validar se há transações vinculadas)

### 3.2 Transações (`/transactions`)
- `POST /transactions`: Registro de gasto ou ganho
  - **Body:**
    ```json
    {
      "description": "UBER",
      "amountInCents": 830,
      "type": "EXPENSE",
      "tagId": "tag-uuid-aqui",
      "transactedAt": "2026-10-01T14:30:00.000Z"
    }
    ```
- `GET /transactions`: Listagem com suporte a query params (`type`, `tagId`, `startDate`, `endDate`).
- `GET /transactions/:id`: Detalhes da transação com dados da tag agregados.
- `DELETE /transactions/:id`: Remoção de transação.

---

## 4. Roteiro de Execução (Fases de Desenvolvimento)

### Fase 1: Módulo de Tags
1. Criar DTOs de entrada (`CreateTagDto`, `UpdateTagDto`) com validação de regex para cor hexadecimal.
2. Implementar `TagsRepository` (em memória ou ORM) e `TagsService`.
3. Criar `TagsController` expondo as rotas CRUD.
4. Escrever testes unitários cobrindo validações e regras de unicidade/existência.

### Fase 2: Módulo de Transações
1. Criar DTOs (`CreateTransactionDto`, `FilterTransactionsDto`).
2. Implementar `TransactionsService`:
   - Validar se a `tagId` informada existe antes de criar a transação.
   - Tratar parsing e validação de `transactedAt` (data/hora).
   - Tratar validação de `type` (`EXPENSE` ou `INCOME`).
3. Criar `TransactionsController` com endpoints de cadastro e busca com filtros.
4. Escrever testes unitários para cálculo de valores e filtros por data/tag.

### Fase 3: Testes de Integração e E2E
1. Configurar suite de testes e2e para simular o fluxo completo:
   - Criar tag `Transporte` (`#FF5733`).
   - Registrar gasto de R$ 8,30 UBER.
   - Criar tag `Fixo` (`#28A745`).
   - Registrar ganho de R$ 1000,00 Estágio.
   - Listar histórico e verificar valores, tags associadas e timestamps.

---

## 5. Critérios de Aceitação

- [ ] É possível criar tags personalizadas passando nome e cor hexadecimal válida (`#RGB` ou `#RRGGBB`).
- [ ] O sistema rejeita cores fora do formato hexadecimal padrão.
- [ ] É possível registrar gastos e ganhos vinculados obrigatoriamente a uma tag existente.
- [ ] Cada transação persiste com precisão a data e a hora do gasto/ganho (`transactedAt`).
- [ ] A listagem de transações retorna a tag associada com seu respectivo nome e cor.
