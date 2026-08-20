import { auth } from "@/auth";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Header />

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
