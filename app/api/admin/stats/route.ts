import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, attendanceRecords, assignments, submissions, events, eventRegistrations } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // User counts by role
  const allUsers = await db.select({ role: users.role }).from(users);
  const totalStudents = allUsers.filter((u) => u.role === "student").length;
  const totalFaculty = allUsers.filter((u) => u.role === "faculty").length;
  const totalCoordinators = allUsers.filter((u) => u.role === "coordinator").length;
  const totalAdmins = allUsers.filter((u) => u.role === "admin").length;

  // Attendance stats
  const allAttendance = await db.select({ present: attendanceRecords.present }).from(attendanceRecords);
  const totalAttendanceRecords = allAttendance.length;
  const presentRecords = allAttendance.filter((a) => a.present).length;
  const overallAttendancePercent =
    totalAttendanceRecords > 0 ? Math.round((presentRecords / totalAttendanceRecords) * 100) : 0;

  // Assignment stats
  const allAssignments = await db.select().from(assignments);
  const totalAssignments = allAssignments.length;

  const allSubmissions = await db.select({ status: submissions.status }).from(submissions);
  const totalSubmissions = allSubmissions.length;
  const reviewedSubmissions = allSubmissions.filter((s) => s.status === "reviewed").length;
  const lateSubmissions = allSubmissions.filter((s) => s.status === "late").length;

  // Event stats
  const allEvents = await db.select().from(events);
  const totalEvents = allEvents.length;

  const allRegistrations = await db
    .select({ status: eventRegistrations.status })
    .from(eventRegistrations);
  const totalRegistrations = allRegistrations.filter((r) => r.status === "registered").length;

  return NextResponse.json({
    users: {
      totalStudents,
      totalFaculty,
      totalCoordinators,
      totalAdmins,
      total: allUsers.length,
    },
    attendance: {
      totalRecords: totalAttendanceRecords,
      presentRecords,
      overallPercent: overallAttendancePercent,
    },
    assignments: {
      totalAssignments,
      totalSubmissions,
      reviewedSubmissions,
      lateSubmissions,
    },
    events: {
      totalEvents,
      totalRegistrations,
    },
  });
}