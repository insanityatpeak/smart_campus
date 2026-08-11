import { pgTable, uuid, varchar, text, timestamp, pgEnum, boolean, integer, date, primaryKey } from "drizzle-orm/pg-core";

// ---------- ENUMS ----------
export const roleEnum = pgEnum("role", ["student", "faculty", "coordinator", "admin"]);
export const submissionStatusEnum = pgEnum("submission_status", ["pending", "submitted", "late", "reviewed"]);
export const eventRegStatusEnum = pgEnum("event_reg_status", ["registered", "cancelled", "attended"]);

// ---------- USERS ----------
export const departments = pgTable("departments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash"), // null if OAuth-only
  role: roleEnum("role").notNull().default("student"),
  emailVerified: timestamp("email_verified"),
  profilePicture: text("profile_picture"),
  phone: varchar("phone", { length: 20 }),
  rollNumber: varchar("roll_number", { length: 50 }),
  departmentId: uuid("department_id").references(() => departments.id),
  semester: integer("semester"),
  skills: text("skills"), // comma-separated for MVP
  linkedin: text("linkedin"),
  github: text("github"),
  resumeUrl: text("resume_url"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- NEXTAUTH ADAPTER TABLES ----------
// Required by DrizzleAdapter for OAuth providers (Google etc).
// Links a Google account to a user row, plus tracks sessions/verification.
export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(),
    provider: varchar("provider", { length: 50 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 50 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] }),
  })
);

export const sessions = pgTable("sessions", {
  sessionToken: varchar("session_token", { length: 255 }).primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires").notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// ---------- ATTENDANCE ----------
export const attendanceSessions = pgTable("attendance_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  facultyId: uuid("faculty_id").references(() => users.id).notNull(),
  subject: varchar("subject", { length: 150 }).notNull(),
  departmentId: uuid("department_id").references(() => departments.id),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attendanceRecords = pgTable("attendance_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").references(() => attendanceSessions.id).notNull(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  present: boolean("present").notNull().default(false),
});

// ---------- ASSIGNMENTS ----------
export const assignments = pgTable("assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  facultyId: uuid("faculty_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  deadline: timestamp("deadline").notNull(),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const submissions = pgTable("submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  assignmentId: uuid("assignment_id").references(() => assignments.id).notNull(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  fileUrl: text("file_url"),
  githubLink: text("github_link"),
  status: submissionStatusEnum("status").notNull().default("pending"),
  marks: integer("marks"),
  feedback: text("feedback"),
  submittedAt: timestamp("submitted_at"),
});

// ---------- EVENTS ----------
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  bannerUrl: text("banner_url"),
  venue: varchar("venue", { length: 200 }),
  registrationDeadline: timestamp("registration_deadline"),
  seats: integer("seats"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eventRegistrations = pgTable("event_registrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").references(() => events.id).notNull(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  status: eventRegStatusEnum("status").notNull().default("registered"),
  qrCode: text("qr_code"),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
});

// ---------- NOTIFICATIONS ----------
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- ACTIVITY LOGS ----------
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  action: varchar("action", { length: 200 }).notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});