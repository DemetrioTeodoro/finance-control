"""
Microsserviço Python (FastAPI) responsável por processar o OFX de uma
FATURA de cartão de crédito e repassar as transações estruturadas para o
back-end Next.js, que é o único responsável por persistir dados no banco.

Escopo: importação de fatura de cartão. As transações resultantes são
sempre vinculadas a um `creditCardId` (nunca a uma conta), então não
disparam nenhuma regra de saldo de conta (AGENTS.md §12/§15).

Fluxo:
    Browser --(multipart: file + creditCardId, cookie de sessão)--> FastAPI
    FastAPI --(parse OFX em memória)--> lista de transações
    FastAPI --(POST JSON, repassando a mesma sessão)--> Next.js /api/transactions/bulk
    FastAPI <--(quantidade persistida)-- Next.js
    Browser <--(resumo da operação)-- FastAPI

Este serviço NUNCA decide o `userId` das transações. Quem faz isso é o
Next.js, a partir da sessão autenticada (Auth.js) — o Python apenas
encaminha o cabeçalho de autenticação recebido do browser. O
`creditCardId` viaja no corpo da requisição (é apenas um identificador de
recurso, não uma credencial), mas cabe ao Next.js validar que ele
pertence ao usuário da sessão antes de vincular qualquer transação a ele
— o mesmo princípio de "nunca confiar em ID de recurso sem checar
propriedade" do AGENTS.md §8.
"""

from __future__ import annotations

import io
import logging
import os
from datetime import date
from decimal import Decimal
from typing import Any

import httpx
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile, status
from ofxparse import OfxParser
from pydantic import BaseModel

logger = logging.getLogger("py-api.processar-extrato")

app = FastAPI(title="Finance Control - Python Pipeline")

# URL base do Next.js. Em produção (Vercel) as duas aplicações vivem no
# mesmo domínio, então o valor pode ser a própria URL pública do projeto
# (ex.: https://meu-projeto.vercel.app). Em desenvolvimento local aponta
# para o servidor Next.js rodando em outra porta.
NEXTJS_API_URL = os.environ.get("NEXTJS_API_URL", "http://localhost:3000").rstrip("/")
BULK_TRANSACTIONS_ENDPOINT = f"{NEXTJS_API_URL}/api/transactions/bulk"

# Cabeçalhos da requisição original do browser que precisam ser
# repassados para o Next.js, para que `auth()` consiga identificar o
# usuário autenticado (Auth.js v5 usa cookie de sessão JWT).
FORWARDED_HEADERS = ("cookie", "authorization")

REQUEST_TIMEOUT = httpx.Timeout(connect=5.0, read=15.0, write=15.0, pool=5.0)


class ProcessarExtratoResponse(BaseModel):
    total_transacoes: int
    enviadas_com_sucesso: int
    mensagem: str


def _extrair_tipo_e_valor(amount: Decimal) -> tuple[str, float]:
    """Converte o valor assinado do OFX para (tipo, valor absoluto).

    O OFX traz valores negativos para débitos e positivos para créditos.
    A aplicação Next.js, por regra de negócio (AGENTS.md), sempre guarda
    o valor absoluto e um campo `type` separado ("income" | "expense").
    """
    tipo = "income" if amount > 0 else "expense"
    return tipo, float(abs(amount))


def _extrair_transacoes(conteudo_ofx: bytes) -> list[dict[str, Any]]:
    try:
        ofx = OfxParser.parse(io.BytesIO(conteudo_ofx))
    except Exception as exc:  # ofxparse não expõe uma exceção específica
        logger.warning("Falha ao interpretar arquivo OFX: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Arquivo OFX inválido ou corrompido.",
        ) from exc

    contas = getattr(ofx, "accounts", None) or ([ofx.account] if getattr(ofx, "account", None) else [])

    if not contas:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nenhuma conta encontrada no arquivo OFX.",
        )

    transacoes: list[dict[str, Any]] = []

    for conta in contas:
        statement = getattr(conta, "statement", None)
        if statement is None:
            continue

        for txn in statement.transactions:
            tipo, valor = _extrair_tipo_e_valor(txn.amount)
            data_txn: date = txn.date.date() if hasattr(txn.date, "date") else txn.date

            descricao = (txn.payee or txn.memo or "Transação sem descrição").strip()

            transacoes.append(
                {
                    "descricao": descricao,
                    "valor": valor,
                    "tipo": tipo,
                    "data": data_txn.strftime("%Y-%m-%d"),
                }
            )

    if not transacoes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nenhuma transação encontrada no arquivo OFX.",
        )

    return transacoes


async def _enviar_para_nextjs(
    transacoes: list[dict[str, Any]],
    credit_card_id: str,
    headers_originais: dict[str, str],
) -> int:
    headers_repassados = {
        nome: valor
        for nome, valor in headers_originais.items()
        if nome.lower() in FORWARDED_HEADERS
    }

    if not headers_repassados:
        # Sem cookie/authorization não há como o Next.js identificar o
        # usuário autenticado — falha rápido em vez de mandar a requisição
        # sem sessão para o Next.js.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessão não encontrada. Faça login novamente.",
        )

    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            response = await client.post(
                BULK_TRANSACTIONS_ENDPOINT,
                json={"creditCardId": credit_card_id, "transacoes": transacoes},
                headers=headers_repassados,
            )
    except httpx.RequestError as exc:
        logger.error("Falha de rede ao chamar o Next.js (%s): %s", BULK_TRANSACTIONS_ENDPOINT, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Não foi possível se comunicar com o servidor principal.",
        ) from exc

    if response.status_code == status.HTTP_401_UNAUTHORIZED:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessão inválida ou expirada.",
        )

    if response.status_code >= 400:
        logger.error(
            "Next.js recusou o lote de transações (status=%s): %s",
            response.status_code,
            response.text,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="O servidor principal recusou as transações enviadas.",
        )

    corpo = response.json()
    return int(corpo.get("count", len(transacoes)))


@app.get("/python-backend/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post(
    "/python-backend/processar-fatura",
    response_model=ProcessarExtratoResponse,
)
async def processar_fatura(
    request: Request,
    file: UploadFile = File(...),
    credit_card_id: str = Form(..., alias="creditCardId"),
) -> ProcessarExtratoResponse:
    if not credit_card_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selecione o cartão para vincular a fatura.",
        )

    if not file.filename or not file.filename.lower().endswith(".ofx"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Envie um arquivo com extensão .ofx.",
        )

    conteudo = await file.read()

    if not conteudo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Arquivo vazio.",
        )

    transacoes = _extrair_transacoes(conteudo)

    total_enviado = await _enviar_para_nextjs(
        transacoes, credit_card_id, dict(request.headers)
    )

    return ProcessarExtratoResponse(
        total_transacoes=len(transacoes),
        enviadas_com_sucesso=total_enviado,
        mensagem=f"{total_enviado} de {len(transacoes)} transações da fatura foram salvas com sucesso.",
    )
