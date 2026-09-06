import { prisma } from "@/lib/prisma";

export async function getValueVisibility(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hideSensitiveValues: true },
  });

  return !user?.hideSensitiveValues;
}

export async function setValueVisibility(userId: string, visible: boolean) {
  await prisma.user.update({
    where: { id: userId },
    data: { hideSensitiveValues: !visible },
  });
}
