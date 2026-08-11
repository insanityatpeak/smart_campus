import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { assignments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const createAssignmentSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  deadline: z.string(), // ISO datetime string
  attachmentUrl: z.string().optional(),
});

// GET: list assignments
// - faculty sees only their own
// - student sees all assignments (so they can submit)
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let results;
  if (session.user.role === "student") {
    results = await db.select().from(assignments).orderBy(desc(assignments.deadline));
  } else {
    results = await db
      .select()
      .from(assignments)
      .where(eq(assignments.facultyId, session.user.id))
      .orderBy(desc(assignments.deadline));
  }

  return NextResponse.json({ assignments: results });
}

// POST: faculty creates a new assignment
export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user || !["faculty", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createAssignmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [newAssignment] = await db
    .insert(assignments)
    .values({
      facultyId: session.user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      deadline: new Date(parsed.data.deadline),
      attachmentUrl: parsed.data.attachmentUrl,
    })
    .returning();

  return NextResponse.json({ assignment: newAssignment }, { status: 201 });
}