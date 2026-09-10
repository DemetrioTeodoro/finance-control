import os

import httpx

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
