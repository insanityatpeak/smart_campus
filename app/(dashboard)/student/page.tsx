import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function StudentDashboard() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold">Welcome, {session.user?.name}</h1>
      <p className="text-neutral-400">Role: {session.user?.role}</p>
      <p className="text-neutral-400">Email: {session.user?.email}</p>
    </div>
  );
}