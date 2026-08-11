import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { attendanceSessions, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const createSessionSchema = z.object({
  subject: z.string().min(2),
  date: z.string(), // ISO date string, e.g. "2026-08-11"
});

// GET: list all sessions created by the logged-in faculty
export async function GET() {
  const session = await auth();

  if (!session?.user || !["faculty", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await db
    .select()
    .from(attendanceSessions)
    .where(eq(attendanceSessions.facultyId, session.user.id))
    .orderBy(desc(attendanceSessions.date));

  return NextResponse.json({ sessions });
}

// POST: create a new attendance session
export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user || !["faculty", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSessionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [newSession] = await db
    .insert(attendanceSessions)
    .values({
      facultyId: session.user.id,
      subject: parsed.data.subject,
      date: parsed.data.date,
    })
    .returning();

  return NextResponse.json({ session: newSession }, { status: 201 });
}