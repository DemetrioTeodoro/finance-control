"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [message, setMessage] = useState("");

  async function handleSubmit(formData: FormData) {
    setMessage("");

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setMessage("Email ou senha inválidos.");
      return;
    }

    window.location.href = "/";
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form action={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Entrar</h1>

        <Input name="email" type="email" placeholder="Email" required />

        <Input name="password" type="password" placeholder="Senha" required />

        <Button type="submit" className="w-full">
          Entrar
        </Button>

        {message && <p className="text-sm text-destructive">{message}</p>}
      </form>
    </div>
  );
}
