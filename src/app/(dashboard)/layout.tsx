import { cookies } from "next/headers";

import { auth } from "@/auth";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { SidebarProvider } from "@/components/sidebar-context";
import { ValueVisibilityProvider } from "@/components/value-visibility-context";
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

  const cookieStore = await cookies();
  const initialVisible = cookieStore.get("values-visible")?.value !== "false";

  return (
    <ValueVisibilityProvider initialVisible={initialVisible}>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <Sidebar />

          <div className="flex min-w-0 flex-1 flex-col">
            <Header />

            <main className="flex-1 p-4 md:p-6">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </ValueVisibilityProvider>
  );
}
