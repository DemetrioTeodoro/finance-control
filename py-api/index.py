"""
Microsserviço Python (FastAPI) responsável por processar o OFX de uma
FATURA de cartão de crédito ou de um EXTRATO de conta bancária, repassando
as transações estruturadas para o back-end Next.js, que é o único
responsável por persistir dados no banco.

Ponto de entrada do serviço (referenciado por `vercel.json` e por
`uvicorn index:app` em desenvolvimento local) — só monta o `FastAPI()` e
inclui os routers. A lógica de negócio está organizada em `app/`:

- `app/config.py`       — configuração de ambiente
- `app/schemas.py`       — modelos de resposta (Pydantic)
- `app/ofx.py`           — parsing do arquivo OFX
- `app/nextjs_client.py` — encaminhamento das transações para o Next.js
- `app/routes/`          — endpoints HTTP

Este serviço NUNCA decide o `userId` das transações — ver AGENTS.md §8.
"""

from __future__ import annotations

from fastapi import FastAPI

from app.routes import health, importacao

app = FastAPI(title="Finance Control - Python Pipeline")

app.include_router(health.router)
app.include_router(importacao.router)
