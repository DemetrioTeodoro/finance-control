<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Finance Control — Instruções para Agentes

## 1. Visão geral

O Finance Control é uma aplicação de gerenciamento financeiro pessoal multiusuário.

A aplicação permite que usuários autenticados gerenciem:

- Contas financeiras
- Categorias
- Transações
- Dashboard financeiro
- Cartões de crédito
- Relatórios

Cada recurso financeiro pertence a um usuário.

**Nunca permitir que um usuário visualize, altere ou exclua dados pertencentes a outro usuário.**

---

## 2. Stack

- Next.js 16
- TypeScript
- React
- App Router
- Tailwind CSS v4
- shadcn/ui
- Lucide Icons
- Sonner
- Prisma 7
- PostgreSQL / Neon
- Auth.js v5
- Credentials Provider
- bcryptjs
- next-themes

---

## 3. Regra específica do Next.js

Este projeto utiliza **Next.js 16**.

Esta versão possui APIs, convenções e comportamentos que podem ser diferentes de versões anteriores.

Antes de implementar ou alterar APIs, padrões ou comportamentos específicos do Next.js, consultar a documentação correspondente instalada em:

```text
node_modules/next/dist/docs/
```

Não assumir que APIs ou padrões de versões anteriores do Next.js continuam válidos.

Quando houver dúvida sobre uma API do Next.js, **verificar primeiro a documentação instalada no projeto antes de implementar**.

---

## 4. Arquitetura

A arquitetura principal é:

```text
page.tsx
    ↓
actions/
    ↓
services/
    ↓
Prisma
    ↓
PostgreSQL
```

### `app/`

Responsável por:

- Páginas
- Layouts
- Composição da interface
- Server Components

### `actions/`

Responsável por:

- Server Actions
- Autenticação
- Leitura de `FormData`
- Validações básicas de entrada
- Conversão de valores
- Chamada dos services
- Conversão de erros técnicos em mensagens amigáveis

As Actions **não devem conter consultas diretas ao banco**.

As Actions também não devem conter regras complexas de negócio.

### `services/`

Responsável por:

- Regras de negócio
- Consultas ao banco
- Operações Prisma
- Validação de propriedade dos recursos
- Cálculos financeiros
- Transações Prisma
- Consistência dos dados

As regras de negócio devem ficar nos services.

### `components/`

Responsável por:

- Componentes reutilizáveis
- Interface
- Interações
- Estado local
- Forms
- Dialogs
- Loading states
- Toasts

### `lib/`

Responsável por infraestrutura compartilhada.

O Prisma Client fica em:

```text
src/lib/prisma.ts
```

### Client Components

Client Components podem cuidar de:

- UI
- Interação
- Estado local
- Formulários
- Dialogs
- Loading states
- Toasts
- `router.refresh()`

Client Components **não devem**:

- Acessar Prisma
- Consultar diretamente o banco
- Implementar regras financeiras
- Implementar regras de autorização
- Confiar em dados enviados pelo cliente para autorizar operações

---

## 5. Estrutura atual

```text
src/
├── actions/
│   ├── auth.ts
│   ├── account.ts
│   ├── category.ts
│   ├── credit-card.ts
│   ├── transaction.ts
│   └── ...
│
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── contas/
│   │   ├── categorias/
│   │   ├── cartoes/
│   │   ├── transacoes/
│   │   ├── relatorios/
│   │   └── ...
│   │
│   ├── login/
│   ├── register/
│   └── api/
│       └── auth/
│
├── components/
│   ├── charts/          # gráficos SVG reutilizáveis (dashboard e relatórios)
│   ├── header.tsx
│   ├── sidebar.tsx
│   ├── sidebar-context.tsx
│   ├── sidebar-toggle-button.tsx
│   ├── value-visibility-context.tsx
│   ├── value-visibility-toggle.tsx
│   ├── sensitive-value.tsx
│   ├── theme-provider.tsx
│   ├── mode-toggle.tsx
│   ├── logout-button.tsx
│   └── ui/
│
├── generated/
│   └── prisma/
│
├── lib/
│   ├── prisma.ts
│   └── date.ts
│
├── services/
│   ├── dashboard.ts
│   ├── report.ts
│   ├── account.ts
│   ├── category.ts
│   ├── credit-card.ts
│   └── transaction.ts
│
└── auth.ts
```

Ao adicionar funcionalidades, respeitar essa estrutura.

Não misturar responsabilidades entre as camadas.

Antes de criar novos diretórios ou padrões arquiteturais, verificar como funcionalidades semelhantes já estão implementadas.

---

## 6. Autenticação

A autenticação utiliza Auth.js v5 com Credentials Provider.

Para obter a sessão:

```ts
const session = await auth();
```

O ID do usuário autenticado é:

```ts
session.user.id;
```

Antes de qualquer operação financeira:

```ts
if (!session?.user?.id) {
  // usuário não autenticado
}
```

Nunca confiar em um `userId` enviado pelo cliente.

Sempre utilizar o ID da sessão autenticada.

---

## 7. Server Actions

Server Actions são pontos de entrada públicos do servidor.

Nunca assumir que uma Action será chamada somente pela interface criada pelo projeto.

Toda Server Action deve:

1. Verificar autenticação.
2. Obter o `userId` da sessão.
3. Ler e validar os dados recebidos.
4. Chamar o service apropriado.
5. Traduzir erros técnicos em mensagens amigáveis.
6. Retornar uma resposta adequada para a interface.

Nunca confiar em IDs enviados pelo cliente para autorização.

As Server Actions não devem conter regras complexas de negócio.

A lógica de negócio deve permanecer nos services.

---

## 8. Segurança e isolamento entre usuários

A aplicação é multiusuário.

Toda operação financeira deve validar a propriedade do recurso.

Exemplo:

```ts
const transaction = await tx.transaction.findFirst({
  where: {
    id: transactionId,
    userId,
  },
});
```

Evitar buscar recursos financeiros somente pelo ID quando a operação exige validação de propriedade.

Essa regra se aplica a:

- Contas
- Transações
- Categorias
- Cartões
- Outros recursos financeiros futuros

Nunca permitir:

- Visualizar recurso de outro usuário
- Editar recurso de outro usuário
- Excluir recurso de outro usuário
- Associar recurso de outro usuário a uma transação

A autorização deve ocorrer no servidor.

---

## 9. Prisma 7

O projeto utiliza Prisma 7.

O Prisma Client gerado está em:

```text
src/generated/prisma
```

Importar o Prisma Client utilizando:

```ts
import { PrismaClient } from "@/generated/prisma/client";
```

Quando for necessário utilizar `Prisma.Decimal`:

```ts
import { Prisma } from "@/generated/prisma/client";
```

Não utilizar:

```ts
import { Prisma } from "@/generated/prisma";
```

---

## 10. Prisma Decimal

`Prisma.Decimal` não deve ser enviado diretamente para Client Components.

Isso pode causar erros como:

```text
Only plain objects can be passed to Client Components from Server Components.

Decimal objects are not supported.
```

Converter valores Decimal antes de enviá-los para Client Components:

```ts
amount: Number(transaction.amount);
```

Isso se aplica a:

- Saldo de contas
- Valores de transações
- Limites de cartões
- Outros campos Decimal

---

## 11. Banco de dados

Modelos atuais:

- `User`
- `Account`
- `CreditCard`
- `Category`
- `Transaction`

Relacionamentos principais:

```text
User
├── Account[]
├── CreditCard[]
├── Category[]
└── Transaction[]
```

Uma `Transaction` pode possuir:

- `Account`
- `CreditCard`
- `Category`

Essas relações podem ser opcionais conforme as regras atuais.

Não alterar essas regras sem necessidade explícita.

---

## 12. Transações sem conta

Transações sem conta são permitidas.

Portanto:

```text
accountId = null
```

é um estado válido.

Uma transação sem conta:

- Pode existir
- Pode ser editada
- Pode ser excluída
- Não altera saldo de nenhuma conta

Não tornar `accountId` obrigatório sem uma mudança explícita da regra de negócio.

---

## 13. Transações sem categoria

Transações sem categoria também são permitidas.

Portanto:

```text
categoryId = null
```

é um estado válido.

Uma transação sem categoria:

- Pode existir
- Pode ser editada
- Pode ser excluída
- Não deve ser considerada inválida somente por não possuir categoria

---

## 14. Tipos de transação

No Prisma, o campo atualmente é:

```text
type String
```

Na aplicação TypeScript utilizamos:

```ts
type: "income" | "expense";
```

Ao buscar transações, normalizar o tipo quando necessário:

```ts
type: transaction.type as "income" | "expense";
```

Não alterar o campo para enum sem necessidade explícita.

---

## 15. Regras de saldo

O saldo da conta representa o saldo atual após as movimentações.

### Receita

```text
saldo + valor
```

### Despesa

```text
saldo - valor
```

Exemplo:

```text
Saldo inicial: R$ 1.000
Receita:       R$   500
Despesa:       R$   200
Saldo atual:   R$ 1.300
```

A consistência do saldo é uma regra financeira crítica.

---

## 16. Saldo inicial da conta

Ao criar uma conta, o usuário pode informar o saldo inicial.

A Action converte o valor:

```ts
const numericBalance = Number(balance);
```

Depois envia ao service:

```ts
await createAccountService({
  userId: session.user.id,
  name,
  type,
  balance: numericBalance,
});
```

---

## 17. Edição de conta

A edição de uma conta atualmente altera apenas:

- Nome
- Tipo

O saldo **não é editado pelo formulário normal de edição**.

Isso é intencional.

O saldo é consequência das movimentações financeiras.

Não adicionar edição direta do saldo ao formulário normal.

Se futuramente for necessário corrigir manualmente o saldo, criar uma funcionalidade específica, como:

```text
Ajustar saldo
```

Não misturar ajuste financeiro com edição dos dados da conta.

---

## 18. Criação de transação

A criação de uma transação deve:

1. Validar descrição.
2. Validar valor.
3. Validar tipo.
4. Validar conta, quando informada.
5. Validar categoria, quando informada.
6. Validar propriedade dos recursos relacionados.
7. Atualizar o saldo da conta, quando houver conta.
8. Criar a transação.

A operação deve utilizar:

```ts
prisma.$transaction(...)
```

A atualização do saldo e a criação da transação devem fazer parte da mesma operação transacional.

---

## 19. Edição de transação

A edição deve manter o saldo consistente.

Fluxo:

```text
Buscar transação antiga
        ↓
Validar propriedade
        ↓
Reverter impacto da conta antiga
        ↓
Validar nova conta
        ↓
Validar nova categoria
        ↓
Aplicar impacto da nova transação
        ↓
Atualizar transação
```

Tudo deve ocorrer dentro de:

```ts
prisma.$transaction(...)
```

Se qualquer etapa falhar, a operação deve ser revertida.

---

## 20. Exclusão de transação

A exclusão de transações já está implementada e testada.

Service:

```ts
deleteTransaction(userId, transactionId);
```

Deve:

1. Buscar a transação usando `id + userId`.
2. Validar propriedade.
3. Reverter o impacto no saldo, se houver conta.
4. Excluir a transação.
5. Retornar sucesso.

### Excluir receita

```text
saldo - valor
```

### Excluir despesa

```text
saldo + valor
```

### Transação sem conta

```text
Excluir transação
        ↓
Nenhum saldo é alterado
```

Toda a operação utiliza:

```ts
prisma.$transaction(...)
```

---

## 21. Exclusão de contas

A exclusão de contas já está implementada e segue as regras abaixo.

Existem dois cenários.

### Conta sem transações

Mostrar confirmação:

```text
Excluir conta?
```

Se confirmado:

```text
Excluir conta
```

### Conta com transações

Mostrar um Dialog informando que existem transações vinculadas.

Perguntar:

```text
Esta conta possui transações vinculadas.

O que deseja fazer?
```

Opções:

### Opção 1 — Deixar transações sem conta

Alterar:

```text
accountId = null
```

nas transações vinculadas.

Depois excluir a conta.

As transações continuam existindo.

### Opção 2 — Excluir transações também

Excluir as transações vinculadas e depois excluir a conta.

A operação deve preservar a consistência dos dados.

Todas as alterações devem ocorrer dentro de:

```ts
prisma.$transaction(...)
```

Nunca executar uma sequência de operações destrutivas independentes quando elas deveriam ser atômicas.

---

## 22. Impacto financeiro ao excluir conta

A conta excluída e seu saldo deixam de existir.

### Se as transações forem mantidas

```text
Transações
    ↓
accountId = null

Conta
    ↓
excluída
```

Nesse cenário:

- As transações continuam existindo.
- Nenhuma outra conta recebe os valores.
- Nenhum saldo de outra conta deve ser alterado.

### Se as transações também forem excluídas

```text
Transações vinculadas
    ↓
excluídas

Conta
    ↓
excluída
```

Nesse cenário:

- As transações deixam de existir.
- O saldo da conta excluída deixa de existir junto com ela.
- Não aplicar os valores das transações em outras contas.
- Não alterar saldos de outras contas.

Toda a operação deve ocorrer dentro de uma única transação Prisma.

---

## 23. Categorias

Categorias:

- Pertencem a um usuário.
- Podem possuir cor.
- Podem possuir ícone.
- São ordenadas por nome.
- Não podem ser duplicadas para o mesmo usuário.

O banco possui:

```prisma
@@unique([userId, name])
```

Portanto:

```text
Usuário A → Alimentação
Usuário B → Alimentação
```

é permitido.

Mas:

```text
Usuário A → Alimentação
Usuário A → Alimentação
```

não é permitido.

---

## 24. UI

Preferir:

- shadcn/ui
- Lucide Icons
- Sonner
- Dialog

Não utilizar:

```ts
window.alert();
```

ou:

```ts
window.confirm();
```

Para confirmações destrutivas utilizar Dialog.

Exemplo:

```text
AccountEditButton
        ↓
AccountEditDialog
        ↓
updateAccount Action
        ↓
updateAccount Service
```

Outro exemplo:

```text
TransactionItem
        ↓
DeleteTransactionDialog
        ↓
deleteTransaction Action
        ↓
deleteTransaction Service
```

Preferir componentes pequenos e com responsabilidade única.

---

## 25. Dialogs

Dialogs devem ser separados dos componentes que controlam sua abertura quando isso melhorar a organização.

Exemplo:

```text
AccountEditButton
        ↓
AccountEditDialog
```

O botão pode controlar o estado de abertura.

O Dialog deve controlar:

- Formulário
- Confirmação
- Loading
- Erros da operação
- Fechamento

Para ações destrutivas, deixar claro:

- O que será excluído
- Consequências
- Ação de confirmação
- Ação de cancelamento

---

## 26. Notificações

O projeto utiliza Sonner.

Sucesso:

```ts
toast.success("Conta atualizada com sucesso.");
```

Erro:

```ts
toast.error("Não foi possível atualizar a conta.");
```

Não mostrar erros técnicos diretamente ao usuário.

As Server Actions devem traduzir erros técnicos para mensagens amigáveis.

---

## 27. Loading states

Operações assíncronas devem possuir loading state.

Exemplos:

```text
Salvar
  ↓
Salvando...
```

```text
Excluir
  ↓
Excluindo...
```

Durante a operação:

- Desabilitar botões
- Evitar múltiplos envios
- Evitar ações duplicadas
- Evitar fechamento acidental do Dialog quando necessário

---

## 28. Atualização dos dados

Depois de uma operação bem-sucedida em um Client Component:

```ts
router.refresh();
```

Isso permite que os Server Components busquem os dados atualizados.

Evitar duplicar desnecessariamente o estado do servidor nos Client Components.

---

## 29. Tratamento de erros

Os services utilizam códigos de erro técnicos.

Exemplos:

```text
TRANSACTION_NOT_FOUND
ACCOUNT_NOT_FOUND
CATEGORY_NOT_FOUND
INVALID_AMOUNT
INVALID_DESCRIPTION
INVALID_ACCOUNT
```

As Actions convertem esses códigos em mensagens amigáveis.

Exemplo:

```ts
if (error.message === "ACCOUNT_NOT_FOUND") {
  return {
    error: "Conta não encontrada.",
  };
}
```

Manter separado:

```text
Erro técnico
    ↓
Server Action
    ↓
Mensagem amigável
```

Não expor stack traces, mensagens internas do Prisma ou detalhes técnicos desnecessários para o usuário.

---

## 30. Validação

A validação existe em mais de uma camada.

### Actions

Responsáveis por:

- Ler `FormData`
- Validar campos obrigatórios
- Validar tipos básicos
- Converter valores
- Verificar autenticação

### Services

Responsáveis por:

- Regras de negócio
- Validação de propriedade
- Validação financeira
- Consistência dos dados

Nunca confiar somente na validação feita pelo Client Component.

---

## 31. Operações financeiras

Toda operação que altera simultaneamente:

- Dados de transação
- Saldo de conta

deve utilizar:

```ts
prisma.$transaction(...)
```

Exemplos:

- Criar transação
- Editar transação
- Excluir transação
- Futuras operações envolvendo contas e transações

A consistência financeira é prioridade.

---

## 32. Sidebar

Rotas atuais:

```text
Dashboard    → /
Contas       → /contas
Transações   → /transacoes
Cartões      → /cartoes
Categorias   → /categorias
Relatórios   → /relatorios
```

O Sidebar utiliza:

```ts
usePathname();
```

para identificar a rota ativa.

Item ativo:

```text
bg-primary text-primary-foreground
```

---

## 33. Funcionalidades implementadas

O backlog original deste documento (seções 34/35 anteriores) foi concluído. Atualmente já existem:

- Cadastro
- Login
- Auth.js
- Sessão JWT
- Proteção do dashboard
- Dashboard, com gráficos de evolução de saldo, receitas x despesas e gastos por categoria
- Contas
- Criação de contas
- Edição de contas
- Exclusão de contas (conta sem transações, ou com transações — deixar sem conta / excluir junto)
- Categorias
- Criação de categorias
- Edição de categorias
- Exclusão de categorias
- Cartões de crédito (criação, edição, exclusão)
- Fatura de cartão de crédito (valor do ciclo em aberto, navegação entre faturas anteriores, calculada a partir do dia de fechamento/vencimento)
- Transações
- Criação de transações
- Edição de transações
- Exclusão de transações
- Vínculo de transações a cartões de crédito
- Filtros de transações (conta, categoria, cartão, tipo, período)
- Atualização de saldo
- Transações sem conta
- Transações sem categoria
- Relatórios (totais de receita/despesa/saldo e detalhamento por categoria, conta e cartão, com filtro de período)
- Botão de ocultar/exibir valores sensíveis (global, persistido via cookie)
- Menu mobile responsivo (Sidebar em drawer)
- Proteção por usuário
- Sidebar
- Dialogs
- Sonner
- Loading states

---

## 34. Funcionalidades em desenvolvimento

Nenhuma funcionalidade em desenvolvimento no momento.

---

## 35. Funcionalidades planejadas

Ideias para próximas iterações, sem prioridade definida:

- Melhorias adicionais de UX

---

## 36. Regras de código

Preferir:

- TypeScript
- Tipos explícitos nos inputs dos services
- Funções pequenas
- Responsabilidade única
- Validação no servidor
- Validação de propriedade
- Prisma Transactions
- shadcn/ui
- Lucide Icons
- Sonner
- Dialogs
- Componentes reutilizáveis

Evitar:

- Prisma dentro de Client Components
- Consultas ao banco dentro de componentes de UI
- Regras de negócio dentro de `page.tsx`
- Confiar em IDs enviados pelo cliente
- Passar Decimal para Client Components
- `window.alert()`
- `window.confirm()`
- Duplicar regras de negócio
- Alterações desnecessárias no schema
- Refatorações não relacionadas à tarefa atual
- Abstrações desnecessárias
- Bibliotecas novas sem necessidade
- Complexidade sem benefício claro

---

## 37. Simplicidade e evitar overengineering

Preferir a solução mais simples que preserve:

- Segurança
- Consistência financeira
- Tipagem
- Arquitetura
- Experiência do usuário

Não adicionar sem necessidade:

- Abstrações complexas
- Bibliotecas novas
- Camadas adicionais
- Padrões arquiteturais não utilizados pelo projeto
- Sistemas genéricos para resolver problemas simples

Antes de criar uma nova abstração, verificar se os padrões existentes já resolvem o problema.

Não transformar uma alteração pequena em uma refatoração ampla.

---

## 38. Alterações no banco de dados

Não alterar o schema do Prisma sem necessidade explícita.

Antes de alterar o schema:

- Verificar os relacionamentos existentes
- Verificar dados e regras de negócio afetados
- Verificar impacto nas migrations
- Verificar compatibilidade com funcionalidades existentes

Não remover ou tornar campos obrigatórios sem verificar o impacto nas funcionalidades existentes.

Alterações de schema devem ser:

- Pequenas
- Justificadas
- Relacionadas diretamente à funcionalidade em desenvolvimento
- Compatíveis com os dados e regras existentes

Evitar alterações de banco não relacionadas à tarefa atual.

---

## 39. Antes de modificar código

Antes de implementar uma funcionalidade:

1. Inspecionar os arquivos relacionados.
2. Entender a implementação existente.
3. Identificar padrões já utilizados.
4. Reutilizar componentes existentes quando possível.
5. Não criar componentes duplicados.
6. Verificar autenticação.
7. Verificar propriedade dos recursos.
8. Considerar impacto financeiro.
9. Considerar consistência transacional.
10. Manter a alteração focada.
11. Não modificar partes não relacionadas sem necessidade.
12. Verificar a documentação instalada do Next.js quando a alteração envolver comportamento específico do framework.

Nunca implementar uma solução baseada apenas na descrição da tarefa quando o comportamento existente puder ser verificado diretamente no código.

**O código existente é a fonte principal para entender como a nova funcionalidade deve ser integrada.**

---

## 40. Ao adicionar uma nova funcionalidade

Seguir, quando aplicável:

```text
Regra de negócio
        ↓
Service
        ↓
Server Action
        ↓
Client Component
        ↓
Dialog / Form
        ↓
Página
        ↓
Teste
```

Não começar implementando lógica de banco na interface.

Não colocar regras de negócio dentro de componentes de UI.

Não mover lógica para outra camada apenas para "seguir um padrão" se o padrão existente do projeto já resolver o problema de forma adequada.

---

## 41. Testes esperados

Para operações financeiras testar:

- Caso normal
- Entrada inválida
- Recurso inexistente
- Usuário incorreto
- Relação opcional ausente
- Alteração de saldo
- Falha durante a operação
- Consistência da transação Prisma

Para exclusão de conta testar:

- Conta sem transações
- Conta com receitas
- Conta com despesas
- Conta com várias transações
- Deixar transações sem conta
- Excluir transações
- Tentativa de excluir conta de outro usuário
- Consistência dos saldos
- Falha durante a operação

---

## 42. Ponto atual do desenvolvimento

O backlog original (contas, categorias, transações, filtros, cartões de crédito, fatura de cartão, gráficos e relatórios) está completo, e o bug de fuso horário na exibição de datas (que existia desde 30/08) foi corrigido. Não há um próximo recurso ou pendência conhecida no momento — ver seção 35 para ideias futuras.

**Sobre o fuso horário**: datas informadas pelo usuário (`yyyy-mm-dd`, formato emitido pelo `DateInput`) devem sempre ser convertidas com `parseLocalDate` de `src/lib/date.ts`, nunca com `new Date(string)` puro — este último interpreta a string como meia-noite UTC, que em fusos negativos (o servidor roda em UTC-3) formata como o dia anterior ao ser exibida com `Intl.DateTimeFormat`. `parseLocalDate` é usado em `actions/transaction.ts` (criação/edição) e nos filtros de data de `transacoes/page.tsx` e `relatorios/page.tsx`. Ao adicionar um novo ponto de entrada de data vinda do usuário, reutilizar essa função.

Antes de iniciar uma nova funcionalidade, seguir as seções 39 e 40 deste documento.

---

## 43. Regra fundamental

Sempre preservar a separação:

```text
page.tsx
   ↓
actions/
   ↓
services/
   ↓
Prisma
```

Client Components devem ser responsáveis por:

```text
UI
+
interação
+
estado local
```

Nunca quebrar essa separação sem uma razão arquitetural clara.

---

## 44. Princípio geral

Ao trabalhar neste projeto:

- Priorizar segurança.
- Priorizar consistência financeira.
- Preservar a arquitetura existente.
- Fazer mudanças pequenas e focadas.
- Não reinventar padrões já existentes.
- Não adicionar complexidade sem necessidade.
- Não alterar regras de negócio sem confirmação.
- Não assumir comportamento de versões antigas do Next.js.
- Sempre verificar o código existente antes de propor uma implementação.
- Preferir soluções simples e fáceis de manter.
- Verificar a documentação instalada do Next.js quando necessário.
- O código existente é a fonte principal para entender como uma funcionalidade deve ser integrada ao projeto.
- Antes de criar novos padrões, verificar como funcionalidades semelhantes já foram implementadas.
- Evitar alterações não relacionadas à tarefa atual.

### Regra de ouro

**Primeiro entender o código existente. Depois implementar a menor alteração necessária para resolver a tarefa, preservando segurança, arquitetura e consistência financeira.**
