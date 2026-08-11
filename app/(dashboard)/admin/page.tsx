import { auth } from "@/lib/auth";

export default async function AdminDashboard() {
  const session = await auth();
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="text-neutral-400">Welcome, {session?.user?.name}</p>
    </div>
  );
}