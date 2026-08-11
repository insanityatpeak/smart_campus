import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import AttendanceSummary from "./attendance-summary";
import StudentAssignments from "./assignments";
import StudentEvents from "./events";

export default async function StudentDashboard() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {session.user?.name}</h1>
        <p className="text-neutral-400">Role: {session.user?.role}</p>
        <p className="text-neutral-400">Email: {session.user?.email}</p>
      </div>

      <AttendanceSummary />
      <StudentAssignments />
      <StudentEvents />

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button className="px-4 py-2 rounded border border-neutral-700">
          Log out
        </button>
      </form>
    </div>
  );
}