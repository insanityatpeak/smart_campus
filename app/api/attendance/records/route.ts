import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { attendanceRecords, attendanceSessions, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const markAttendanceSchema = z.object({
  sessionId: z.string().uuid(),
  records: z.array(
    z.object({
      studentId: z.string().uuid(),
      present: z.boolean(),
    })
  ),
});

// GET: fetch all students + a list of all-students-for-marking, OR student's own history
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (sessionId) {
    // Faculty fetching records for a specific session (to see who's marked)
    const records = await db
      .select({
        id: attendanceRecords.id,
        studentId: attendanceRecords.studentId,
        present: attendanceRecords.present,
        studentName: users.name,
      })
      .from(attendanceRecords)
      .innerJoin(users, eq(attendanceRecords.studentId, users.id))
      .where(eq(attendanceRecords.sessionId, sessionId));

    return NextResponse.json({ records });
  }

  // Student fetching their own full attendance history
  const records = await db
    .select({
      id: attendanceRecords.id,
      present: attendanceRecords.present,
      subject: attendanceSessions.subject,
      date: attendanceSessions.date,
    })
    .from(attendanceRecords)
    .innerJoin(attendanceSessions, eq(attendanceRecords.sessionId, attendanceSessions.id))
    .where(eq(attendanceRecords.studentId, session.user.id));

  const total = records.length;
  const presentCount = records.filter((r) => r.present).length;
  const percentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  return NextResponse.json({ records, total, presentCount, percentage });
}

// POST: faculty marks attendance for all students in a session
export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user || !["faculty", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = markAttendanceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { sessionId, records } = parsed.data;

  // Delete existing records for this session first (allows re-marking/editing)
  await db.delete(attendanceRecords).where(eq(attendanceRecords.sessionId, sessionId));

  // Insert fresh records
  const inserted = await db
    .insert(attendanceRecords)
    .values(records.map((r) => ({ sessionId, studentId: r.studentId, present: r.present })))
    .returning();

  return NextResponse.json({ records: inserted }, { status: 201 });
}