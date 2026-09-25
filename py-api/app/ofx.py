from __future__ import annotations

import io
import logging
from datetime import date
from decimal import Decimal
from typing import Any

from fastapi import HTTPException, status
from ofxparse import OfxParser

logger = logging.getLogger("py-api.ofx")


def extrair_tipo_e_valor(amount: Decimal) -> tuple[str, float]:
    """Converte o valor assinado do OFX para (tipo, valor absoluto).

    O OFX traz valores negativos para débitos e positivos para créditos.
    A aplicação Next.js, por regra de negócio (AGENTS.md), sempre guarda
    o valor absoluto e um campo `type` separado ("income" | "expense").
    """
    tipo = "income" if amount > 0 else "expense"
    return tipo, float(abs(amount))


def extrair_transacoes(conteudo_ofx: bytes) -> list[dict[str, Any]]:
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
            tipo, valor = extrair_tipo_e_valor(txn.amount)
            data_txn: date = txn.date.date() if hasattr(txn.date, "date") else txn.date

            descricao = (txn.payee or txn.memo or "Transação sem descrição").strip()

            # FITID: ID único da transação no banco. O Next.js usa para não
            # duplicar transações quando o mesmo período é importado de novo.
            id_externo = (getattr(txn, "id", None) or "").strip() or None

            transacoes.append(
                {
                    "descricao": descricao,
                    "valor": valor,
                    "tipo": tipo,
                    "data": data_txn.strftime("%Y-%m-%d"),
                    "idExterno": id_externo,
                }
            )

    if not transacoes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nenhuma transação encontrada no arquivo OFX.",
        )

    return transacoes
