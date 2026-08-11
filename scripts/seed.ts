// Populates demo data for testing/judging — safe to re-run, skips existing rows
import "dotenv/config";
import { db } from "../db";
import {
  users,
  departments,
  attendanceSessions,
  attendanceRecords,
  assignments,
  submissions,
  events,
  eventRegistrations,
} from "../db/schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding...");

  // Departments
  const [cse] = await db
    .insert(departments)
    .values({ name: "Computer Science", code: "CSE" })
    .onConflictDoNothing()
    .returning();

  // Demo users — same password for all, easy for judges to test
  const passwordHash = await bcrypt.hash("Test1234!", 10);

  const [student] = await db
    .insert(users)
    .values({
      name: "Demo Student",
      email: "student@calypso.test",
      passwordHash,
      role: "student",
      departmentId: cse?.id,
    })
    .onConflictDoNothing()
    .returning();

  const [faculty] = await db
    .insert(users)
    .values({
      name: "Demo Faculty",
      email: "faculty@calypso.test",
      passwordHash,
      role: "faculty",
      departmentId: cse?.id,
    })
    .onConflictDoNothing()
    .returning();

  await db
    .insert(users)
    .values({
      name: "Demo Admin",
      email: "admin@calypso.test",
      passwordHash,
      role: "admin",
    })
    .onConflictDoNothing();

  if (!student || !faculty) {
    console.log("Users already exist, skipping dependent data to avoid duplicates.");
    return;
  }

  // Attendance session + record
  const [session] = await db
    .insert(attendanceSessions)
    .values({ facultyId: faculty.id, subject: "Data Structures", date: "2026-08-10" })
    .returning();

  await db.insert(attendanceRecords).values({
    sessionId: session.id,
    studentId: student.id,
    present: true,
  });

  // Assignment + submission
  const [assignment] = await db
    .insert(assignments)
    .values({
      facultyId: faculty.id,
      title: "Binary Search Trees",
      description: "Implement insert, delete, and traversal.",
      deadline: new Date("2026-12-01T23:59:00"),
    })
    .returning();

  await db.insert(submissions).values({
    assignmentId: assignment.id,
    studentId: student.id,
    githubLink: "https://github.com/insanityatpeak/demo-submission",
    status: "submitted",
    submittedAt: new Date(),
  });

  // Event + registration
  const [event] = await db
    .insert(events)
    .values({
      createdBy: faculty.id,
      title: "Orientation Day",
      description: "Welcome session for new students.",
      venue: "Main Auditorium",
      seats: 200,
    })
    .returning();

  await db.insert(eventRegistrations).values({
    eventId: event.id,
    studentId: student.id,
    qrCode: `${event.id}:${student.id}`,
  });

  console.log("Seed complete.");
  console.log("Login with: student@calypso.test / faculty@calypso.test / admin@calypso.test");
  console.log("Password for all: Test1234!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });