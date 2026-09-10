"""
Endpoints de importação em lote de transações a partir de arquivos OFX.

Fluxo (igual para fatura de cartão e extrato de conta):
    Browser --(multipart: file + creditCardId/accountId, cookie de sessão)--> FastAPI
    FastAPI --(parse OFX em memória)--> lista de transações
    FastAPI --(POST JSON, repassando a mesma sessão)--> Next.js /api/transactions/bulk
    FastAPI <--(quantidade persistida)-- Next.js
    Browser <--(resumo da operação)-- FastAPI

Este serviço NUNCA decide o `userId` das transações. Quem faz isso é o
Next.js, a partir da sessão autenticada (Auth.js) — o Python apenas
encaminha o cabeçalho de autenticação recebido do browser. O
`creditCardId`/`accountId` viaja no corpo da requisição (é apenas um
identificador de recurso, não uma credencial), mas cabe ao Next.js
validar que ele pertence ao usuário da sessão antes de vincular qualquer
transação a ele — o mesmo princípio de "nunca confiar em ID de recurso
sem checar propriedade" do AGENTS.md §8.

`processar_fatura` vincula as transações a um `creditCardId` (nunca a uma
conta, então não dispara regra de saldo — AGENTS.md §12/§15).
`processar_extrato` vincula a um `accountId` — nesse caso o Next.js
atualiza o saldo da conta (AGENTS.md §15/§18).
"""

from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile, status

from ..nextjs_client import enviar_para_nextjs
from ..ofx import extrair_transacoes
from ..schemas import ProcessarExtratoResponse

router = APIRouter()


@router.post(
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

    transacoes = extrair_transacoes(conteudo)

    total_enviado = await enviar_para_nextjs(
        transacoes, "creditCardId", credit_card_id, dict(request.headers)
    )

    return ProcessarExtratoResponse(
        total_transacoes=len(transacoes),
        enviadas_com_sucesso=total_enviado,
        mensagem=f"{total_enviado} de {len(transacoes)} transações da fatura foram salvas com sucesso.",
    )


@router.post(
    "/python-backend/processar-extrato",
    response_model=ProcessarExtratoResponse,
)
async def processar_extrato(
    request: Request,
    file: UploadFile = File(...),
    account_id: str = Form(..., alias="accountId"),
) -> ProcessarExtratoResponse:
    if not account_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selecione a conta para vincular o extrato.",
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

    transacoes = extrair_transacoes(conteudo)

    total_enviado = await enviar_para_nextjs(
        transacoes, "accountId", account_id, dict(request.headers)
    )

    return ProcessarExtratoResponse(
        total_transacoes=len(transacoes),
        enviadas_com_sucesso=total_enviado,
        mensagem=f"{total_enviado} de {len(transacoes)} transações do extrato foram salvas com sucesso.",
    )
