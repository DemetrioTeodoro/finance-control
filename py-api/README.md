# py-api

Microsserviço Python (FastAPI) responsável por processar o OFX de uma
**fatura de cartão de crédito** e repassar as transações estruturadas para o
back-end Next.js, que é o único responsável por persistir dados no banco.

Ver `index.py` para o fluxo completo e as regras de negócio envolvidas.

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

## Deploy

Em produção (Vercel), o roteamento entre `web` e `py_api` é feito pelo
`vercel.json` (Vercel Services), sem necessidade de rodar uvicorn manualmente.
