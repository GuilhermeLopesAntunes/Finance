# Especificação Técnica: Módulo de Analytics Financeiro

Documento de requisitos e contratos de API para o desenvolvimento do motor de análises (Analytics) do sistema de controle financeiro.

---

## 1. Visão Geral

O módulo de Analytics processa transações de gastos (`EXPENSE`) e ganhos (`INCOME`), tags com cores em hexadecimal e timestamps precisos (`transactedAt`) para gerar métricas financeiras e comportamentais.

---

## 2. Métricas e Análises Principais

### 2.1 Resumo Geral (Summary)
- **Total de Ganhos (Incomes):** Soma de transações de entrada no período.
- **Total de Gastos (Expenses):** Soma de transações de saída no período.
- **Saldo Líquido (Net Balance):** `Total Ganhos - Total Gastos`.
- **Taxa de Poupança (Savings Rate):** `((Total Ganhos - Total Gastos) / Total Ganhos) * 100` (se ganhos > 0).

### 2.2 Distribuição por Tags (Categorias)
- **Gasto/Ganho por Tag:** Total em centavos e percentual relativo sobre o total do período.
- **Identidade Visual:** Retorna o `name` e a `colorHex` da tag para renderização direta em gráficos (Donut/Pie/Bar).

### 2.3 Padrões Comportamentais Temporais (Time Patterns)
- **Gastos por Hora do Dia (0h - 23h):** Identificação de horários de pico de consumo (ex: 12h-14h almoço, 20h-23h delivery).
- **Gastos por Dia da Semana (Domingo - Sábado):** Identificação de concentração de gastos (ex: fins de semana vs dias úteis).

### 2.4 Fluxo Temporal (Cash Flow Timeline)
- Agrupamento temporal (`daily`, `weekly`, `monthly`) de entradas e saídas para gráficos de linha ou barras empilhadas.

### 2.5 Indicadores de Transação (Stats)
- **Ticket Médio:** Valor médio por gasto e por ganho.
- **Maior Gasto / Maior Ganho:** Transações de maior valor registradas no período.

---

## 3. Contratos de API (Endpoints & DTOs)

### 3.1 `GET /analytics/summary`
**Query Params:** `startDate` (ISO), `endDate` (ISO)

**Response (200 OK):**
```json
{
  "totalIncomesInCents": 120000,
  "totalExpensesInCents": 3830,
  "netBalanceInCents": 116170,
  "savingsRatePercent": 96.8,
  "averageExpenseInCents": 1915,
  "averageIncomeInCents": 60000,
  "transactionCount": {
    "expenses": 2,
    "incomes": 2,
    "total": 4
  }
}
```

---

### 3.2 `GET /analytics/tags-distribution`
**Query Params:** `type` (`EXPENSE` | `INCOME`), `startDate` (ISO), `endDate` (ISO)

**Response (200 OK):**
```json
{
  "type": "EXPENSE",
  "totalInCents": 3830,
  "items": [
    {
      "tagId": "tag-lazer-id",
      "tagName": "Lazer",
      "colorHex": "#E63946",
      "totalInCents": 3000,
      "percentage": 78.33,
      "count": 1
    },
    {
      "tagId": "tag-transporte-id",
      "tagName": "Transporte",
      "colorHex": "#457B9D",
      "totalInCents": 830,
      "percentage": 21.67,
      "count": 1
    }
  ]
}
```

---

### 3.3 `GET /analytics/time-patterns`
**Query Params:** `startDate` (ISO), `endDate` (ISO)

**Response (200 OK):**
```json
{
  "byHour": [
    { "hour": 8, "totalExpensesInCents": 830, "count": 1 },
    { "hour": 21, "totalExpensesInCents": 3000, "count": 1 }
  ],
  "byDayOfWeek": [
    { "dayOfWeek": 5, "dayName": "Friday", "totalExpensesInCents": 3830, "count": 2 }
  ]
}
```

---

### 3.4 `GET /analytics/timeline`
**Query Params:** `interval` (`day` | `week` | `month`), `startDate` (ISO), `endDate` (ISO)

**Response (200 OK):**
```json
{
  "interval": "day",
  "points": [
    {
      "date": "2026-10-01",
      "incomesInCents": 120000,
      "expensesInCents": 3830,
      "netBalanceInCents": 116170
    }
  ]
}
```

---

## 4. Requisitos de Implementação

1. **Agregações Eficientes:** Utilizar queries agregadas do banco de dados (SQL `SUM`, `GROUP BY`, `EXTRACT(HOUR FROM ...)`) ou funções de agregação em memória caso o repositório seja in-memory.
2. **Tratamento de Timezones:** Garantir que extrações de hora e dia da semana respeitem o timezone do usuário ou padronizem em UTC com offset configurável.
3. **Valores Monetários Seguros:** Todas as agregações e porcentagens devem evitar erros de arredondamento de float.
4. **Testes Unitários:** Cobrir cenários de divisão por zero (quando não há transações ou ganhos) e filtros com intervalos vazios.
