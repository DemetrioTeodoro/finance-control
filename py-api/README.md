# py-api

Microsserviço Python (FastAPI) responsável por processar o OFX de uma
**fatura de cartão de crédito** ou de um **extrato de conta bancária** e
repassar as transações estruturadas para o back-end Next.js, que é o único
responsável por persistir dados no banco.

`index.py` é só o ponto de entrada (monta o `FastAPI()` e inclui os
routers) — a lógica fica organizada em `app/`:

- `app/config.py` — configuração de ambiente (URL do Next.js, headers
  repassados, timeout do HTTP client).
- `app/schemas.py` — modelos de resposta (Pydantic).
- `app/ofx.py` — parsing do arquivo OFX.
- `app/nextjs_client.py` — encaminhamento das transações para
  `/api/transactions/bulk` do Next.js.
- `app/routes/` — endpoints HTTP (`health.py`, `importacao.py`).

## Rodando localmente

```bash
cd py-api
source .venv/bin/activate
uvicorn index:app --reload --port 8000
```

- `cd py-api` — necessário porque `index:app` se refere ao arquivo `index.py`
  desta pasta (o objeto `app` do FastAPI dentro dele).
- `source .venv/bin/activate` — ativa o virtualenv já criado em `py-api/.venv/`,
  com as dependências (`fastapi`, `uvicorn`, `ofxparse`, `httpx`) já instaladas.
  Se a pasta `.venv/` não existir ainda, criar com
  `python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`.
- `uvicorn index:app --reload --port 8000` — sobe o servidor. `--reload`
  reinicia sozinho ao editar o código; `--port 8000` precisa bater com o
  rewrite de dev do Next.js (`next.config.ts`), que aponta
  `/python-backend/*` para `http://localhost:8000`.

Health check:

```bash
curl http://localhost:8000/python-backend/health
```

## Testando a importação de fatura

Com o Next.js (`npm run dev`, porta 3000) e o py-api (porta 8000) rodando ao
mesmo tempo, o teste normal é pela própria interface: logado em
`http://localhost:3000`, usar o botão de importar fatura na tela de um
cartão de crédito e selecionar um arquivo `.ofx`.

O Next.js chama `/python-backend/processar-fatura` (redirecionado pelo
rewrite de dev para o uvicorn local); o Python faz o parse do OFX e reenvia
o resultado para `/api/transactions/bulk` do próprio Next.js, repassando o
cookie de sessão do browser — o Python nunca decide o `userId`.

## Testando a importação de extrato

Mesmo cenário (Next.js na porta 3000 + py-api na porta 8000): usar o botão
"Importar extrato" na tela de uma conta (`/contas`) e selecionar um arquivo
`.ofx`.

O fluxo é o mesmo da fatura, chamando `/python-backend/processar-extrato`
em vez de `processar-fatura` e enviando `accountId` em vez de
`creditCardId` para `/api/transactions/bulk`. A diferença de comportamento
é que, por serem transações de conta, o saldo (`Account.balance`) é
atualizado — diferente da importação de fatura, que nunca afeta saldo.

## Deploy

Em produção (Vercel), o roteamento entre `web` e `py_api` é feito pelo
`vercel.json` (Vercel Services), sem necessidade de rodar uvicorn manualmente.
