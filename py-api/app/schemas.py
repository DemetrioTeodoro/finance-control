from pydantic import BaseModel


class ProcessarExtratoResponse(BaseModel):
    total_transacoes: int
    enviadas_com_sucesso: int
    mensagem: str
