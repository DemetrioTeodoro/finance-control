from __future__ import annotations

import logging
from typing import Any

import httpx
from fastapi import HTTPException, status

from .config import BULK_TRANSACTIONS_ENDPOINT, FORWARDED_HEADERS, REQUEST_TIMEOUT

logger = logging.getLogger("py-api.nextjs-client")


async def enviar_para_nextjs(
    transacoes: list[dict[str, Any]],
    resource_field: str,
    resource_id: str,
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
                json={resource_field: resource_id, "transacoes": transacoes},
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
