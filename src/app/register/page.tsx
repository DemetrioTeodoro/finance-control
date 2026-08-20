"use client";

import { useState } from "react";
import { registerUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const [message, setMessage] = useState("");

  async function handleSubmit(formData: FormData) {
    const result = await registerUser(formData);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Usuário criado com sucesso!");
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form action={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Criar conta</h1>

        <Input name="name" placeholder="Nome" />

        <Input name="email" type="email" placeholder="Email" />

        <Input name="password" type="password" placeholder="Senha" />

        <Button type="submit" className="w-full">
          Cadastrar
        </Button>

        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </form>
    </div>
  );
}
