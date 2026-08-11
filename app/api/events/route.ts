import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { events } from "@/db/schema";
import { desc } from "drizzle-orm";
import { z } from "zod";

const createEventSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  bannerUrl: z.string().optional(),
  venue: z.string().optional(),
  registrationDeadline: z.string().optional(),
  seats: z.number().optional(),
});

// GET: everyone can see all events (needed for students to browse + register)
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await db.select().from(events).orderBy(desc(events.createdAt));
  return NextResponse.json({ events: results });
}

// POST: admin, coordinator, faculty can create events
export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user || !["admin", "coordinator", "faculty"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, description, bannerUrl, venue, registrationDeadline, seats } = parsed.data;

  const [newEvent] = await db
    .insert(events)
    .values({
      createdBy: session.user.id,
      title,
      description,
      bannerUrl,
      venue,
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
      seats,
    })
    .returning();

  return NextResponse.json({ event: newEvent }, { status: 201 });
}