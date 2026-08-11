import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { submissions, assignments, users, activityLogs, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const submitSchema = z.object({
  assignmentId: z.string().uuid(),
  fileUrl: z.string().optional(),
  githubLink: z.string().optional(),
});

const reviewSchema = z.object({
  submissionId: z.string().uuid(),
  marks: z.number().min(0).max(100),
  feedback: z.string().optional(),
});

// GET: 
// - student: fetch own submission for a given assignmentId (?assignmentId=xxx)
// - faculty: fetch all submissions for a given assignmentId
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const assignmentId = searchParams.get("assignmentId");

  if (!assignmentId) {
    return NextResponse.json({ error: "assignmentId required" }, { status: 400 });
  }

  if (session.user.role === "student") {
    const [own] = await db
      .select()
      .from(submissions)
      .where(
        and(
          eq(submissions.assignmentId, assignmentId),
          eq(submissions.studentId, session.user.id)
        )
      )
      .limit(1);

    return NextResponse.json({ submission: own || null });
  }

  // faculty/admin: all submissions for this assignment, with student names.
  // Confirm the assignment actually belongs to this faculty member before
  // handing back the roster of who submitted what — otherwise any faculty
  // account could view another faculty's assignment submissions.
  if (session.user.role === "faculty") {
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, assignmentId))
      .limit(1);

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (assignment.facultyId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }
  // admins can view any assignment's submissions, no extra check needed

  const all = await db
    .select({
      id: submissions.id,
      studentId: submissions.studentId,
      studentName: users.name,
      fileUrl: submissions.fileUrl,
      githubLink: submissions.githubLink,
      status: submissions.status,
      marks: submissions.marks,
      feedback: submissions.feedback,
      submittedAt: submissions.submittedAt,
    })
    .from(submissions)
    .innerJoin(users, eq(submissions.studentId, users.id))
    .where(eq(submissions.assignmentId, assignmentId));

  return NextResponse.json({ submissions: all });
}

// POST: student submits (or re-submits) a solution
export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = submitSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { assignmentId, fileUrl, githubLink } = parsed.data;

  // check deadline for late status
  const [assignment] = await db
    .select()
    .from(assignments)
    .where(eq(assignments.id, assignmentId))
    .limit(1);

  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  const isLate = new Date() > new Date(assignment.deadline);

  // check if a submission already exists (re-submit case)
  const [existing] = await db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.assignmentId, assignmentId),
        eq(submissions.studentId, session.user.id)
      )
    )
    .limit(1);

  let result;
  if (existing) {
    [result] = await db
      .update(submissions)
      .set({
        fileUrl,
        githubLink,
        status: isLate ? "late" : "submitted",
        submittedAt: new Date(),
      })
      .where(eq(submissions.id, existing.id))
      .returning();
  } else {
    [result] = await db
      .insert(submissions)
      .values({
        assignmentId,
        studentId: session.user.id,
        fileUrl,
        githubLink,
        status: isLate ? "late" : "submitted",
        submittedAt: new Date(),
      })
      .returning();
  }

  return NextResponse.json({ submission: result }, { status: 201 });
}

// PATCH: faculty reviews a submission (marks + feedback)
export async function PATCH(req: Request) {
  const session = await auth();

  if (!session?.user || !["faculty", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Confirm the submission belongs to an assignment created by this faculty
  // member before allowing the grade to be written — otherwise any faculty
  // account could overwrite marks on another faculty's assignment.
  const [target] = await db
    .select({
      submissionId: submissions.id,
      studentId: submissions.studentId,
      assignmentFacultyId: assignments.facultyId,
    })
    .from(submissions)
    .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
    .where(eq(submissions.id, parsed.data.submissionId))
    .limit(1);

  if (!target) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  if (session.user.role !== "admin" && target.assignmentFacultyId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const [updated] = await db
    .update(submissions)
    .set({
      marks: parsed.data.marks,
      feedback: parsed.data.feedback,
      status: "reviewed",
    })
    .where(eq(submissions.id, parsed.data.submissionId))
    .returning();

  // Audit log — records who graded what, for accountability
  await db.insert(activityLogs).values({
    userId: session.user.id,
    action: "graded_submission",
    details: `Marks: ${parsed.data.marks}, Submission: ${parsed.data.submissionId}`,
  });

  // Notify the student their submission was graded
  await db.insert(notifications).values({
    userId: updated.studentId,
    title: "Assignment graded",
    message: `You received ${parsed.data.marks}/100. ${parsed.data.feedback || ""}`.trim(),
  });

  return NextResponse.json({ submission: updated });
}