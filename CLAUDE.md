# Finance Control

Este projeto é uma aplicação de gerenciamento financeiro pessoal
multiusuário.

As regras gerais de desenvolvimento estão em:

@AGENTS.md

Sempre leia e respeite as instruções de `AGENTS.md` antes de modificar
o código.

## Regra adicional do projeto

Antes de implementar qualquer funcionalidade:

1. Inspecionar os arquivos relacionados.
2. Seguir a arquitetura existente.
3. Não misturar responsabilidades.
4. Validar autenticação e propriedade dos recursos.
5. Considerar impacto financeiro e consistência dos saldos.
6. Evitar alterações não relacionadas à tarefa.

A arquitetura principal é:

page.tsx
→ actions/
→ services/
→ Prisma
→ PostgreSQL
