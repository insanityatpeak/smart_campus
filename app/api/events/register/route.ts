import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { eventRegistrations, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const registerSchema = z.object({
  eventId: z.string().uuid(),
});

const cancelSchema = z.object({
  registrationId: z.string().uuid(),
});

// GET: student's own registrations (all events they've registered for)
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await db
    .select()
    .from(eventRegistrations)
    .where(eq(eventRegistrations.studentId, session.user.id));

  return NextResponse.json({ registrations: results });
}

// POST: register for an event
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { eventId } = parsed.data;

  // check if already registered
  const [existing] = await db
    .select()
    .from(eventRegistrations)
    .where(
      and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.studentId, session.user.id)
      )
    )
    .limit(1);

  if (existing && existing.status === "registered") {
    return NextResponse.json({ error: "Already registered" }, { status: 409 });
  }

  let result;
  if (existing) {
    // re-registering after a cancel
    [result] = await db
      .update(eventRegistrations)
      .set({ status: "registered" })
      .where(eq(eventRegistrations.id, existing.id))
      .returning();
  } else {
    // qrCode field just stores a unique string we'll render as an image via public QR API
    const qrPayload = `${eventId}:${session.user.id}`;
    [result] = await db
      .insert(eventRegistrations)
      .values({ eventId, studentId: session.user.id, qrCode: qrPayload })
      .returning();
  }

  // Notify the student their registration went through
  await db.insert(notifications).values({
    userId: session.user.id,
    title: "Event registration confirmed",
    message: "You're registered. Check your dashboard for your QR ticket.",
  });

  return NextResponse.json({ registration: result }, { status: 201 });
}

// PATCH: cancel a registration
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = cancelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Only cancel a registration that actually belongs to the requesting
  // student — otherwise any student could cancel any other student's
  // event registration just by guessing/obtaining a registrationId.
  const [updated] = await db
    .update(eventRegistrations)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(eventRegistrations.id, parsed.data.registrationId),
        eq(eventRegistrations.studentId, session.user.id)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }

  return NextResponse.json({ registration: updated });
}