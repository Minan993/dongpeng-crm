import { redirect } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { getCurrentUser } from "@/lib/auth";

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <AppLayout userName={user.name} userRole={user.role}>
      {children}
    </AppLayout>
  );
}
