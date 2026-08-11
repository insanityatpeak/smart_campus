import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["student", "faculty"]).default("student"),
});

export async function POST(req: Request) {
  try {
    // Block IPs making too many signup attempts (brute-force protection)
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(`signup:${ip}`, 5, 60_000)) {
      return NextResponse.json(
        { error: "Too many attempts, try again later" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, role } = parsed.data;

    // Prevent duplicate accounts
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Never store plaintext passwords — hash before insert
    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({ name, email, passwordHash, role })
      .returning({ id: users.id, email: users.email });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}