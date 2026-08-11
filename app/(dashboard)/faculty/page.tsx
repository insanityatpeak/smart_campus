"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { signOut } from "next-auth/react";
import NotificationBell from "@/components/NotificationBell";

type Student = { id: string; name: string; email: string };
type Session = { id: string; subject: string; date: string };
type Assignment = { id: string; title: string; description: string | null; deadline: string };
type Submission = {
  id: string;
  studentId: string;
  studentName: string;
  fileUrl: string | null;
  githubLink: string | null;
  status: string;
  marks: number | null;
  feedback: string | null;
  submittedAt: string | null;
};
type Event = {
  id: string;
  title: string;
  description: string | null;
  venue: string | null;
  registrationDeadline: string | null;
  seats: number | null;
};

export default function FacultyDashboard() {
  const { showToast } = useToast();

  // --- Attendance state ---
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // --- Assignments state ---
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [aTitle, setATitle] = useState("");
  const [aDescription, setADescription] = useState("");
  const [aDeadline, setADeadline] = useState("");
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, { marks: string; feedback: string }>>({});

  // --- Events state ---
  const [eventsList, setEventsList] = useState<Event[]>([]);
  const [eTitle, setETitle] = useState("");
  const [eDescription, setEDescription] = useState("");
  const [eVenue, setEVenue] = useState("");
  const [eDeadline, setEDeadline] = useState("");
  const [eSeats, setESeats] = useState("");

  useEffect(() => {
    fetchSessions();
    fetchStudents();
    fetchAssignments();
    fetchEvents();
  }, []);

  // ===== ATTENDANCE FUNCTIONS =====
  async function fetchSessions() {
    const res = await fetch("/api/attendance/sessions");
    const data = await res.json();
    if (res.ok) setSessions(data.sessions);
  }

  async function fetchStudents() {
    const res = await fetch("/api/users/students");
    const data = await res.json();
    if (res.ok) setStudents(data.students);
  }

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/attendance/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, date }),
    });

    setLoading(false);

    if (!res.ok) {
      showToast("Failed to create session", "error");
      return;
    }

    setSubject("");
    setDate("");
    fetchSessions();
    showToast("Session created", "success");
  }

  function openMarkingFor(sessionId: string) {
    setActiveSessionId(sessionId);
    const defaults: Record<string, boolean> = {};
    students.forEach((s) => (defaults[s.id] = false));
    setAttendance(defaults);
  }

  async function handleSaveAttendance() {
    if (!activeSessionId) return;
    setLoading(true);

    const records = Object.entries(attendance).map(([studentId, present]) => ({
      studentId,
      present,
    }));

    const res = await fetch("/api/attendance/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: activeSessionId, records }),
    });

    setLoading(false);

    if (res.ok) {
      showToast("Attendance saved", "success");
      setActiveSessionId(null);
    } else {
      showToast("Failed to save attendance", "error");
    }
  }

  // ===== ASSIGNMENTS FUNCTIONS =====
  async function fetchAssignments() {
    const res = await fetch("/api/assignments");
    const data = await res.json();
    if (res.ok) setAssignments(data.assignments);
  }

  async function handleCreateAssignment(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: aTitle,
        description: aDescription,
        deadline: new Date(aDeadline).toISOString(),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      showToast("Failed to create assignment", "error");
      return;
    }

    setATitle("");
    setADescription("");
    setADeadline("");
    fetchAssignments();
    showToast("Assignment created", "success");
  }

  async function openSubmissionsFor(assignmentId: string) {
    setActiveAssignmentId(assignmentId);
    const res = await fetch(`/api/submissions?assignmentId=${assignmentId}`);
    const data = await res.json();
    if (res.ok) {
      setSubmissions(data.submissions);
      const drafts: Record<string, { marks: string; feedback: string }> = {};
      data.submissions.forEach((s: Submission) => {
        drafts[s.id] = {
          marks: s.marks?.toString() || "",
          feedback: s.feedback || "",
        };
      });
      setReviewDrafts(drafts);
    }
  }

  async function handleReview(submissionId: string) {
    const draft = reviewDrafts[submissionId];
    if (!draft || draft.marks === "") return;

    setLoading(true);
    const res = await fetch("/api/submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId,
        marks: Number(draft.marks),
        feedback: draft.feedback,
      }),
    });
    setLoading(false);

    if (res.ok) {
      showToast("Review saved", "success");
      if (activeAssignmentId) openSubmissionsFor(activeAssignmentId);
    } else {
      showToast("Failed to save review", "error");
    }
  }

  // ===== EVENTS FUNCTIONS =====
  async function fetchEvents() {
    const res = await fetch("/api/events");
    const data = await res.json();
    if (res.ok) setEventsList(data.events);
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: eTitle,
        description: eDescription,
        venue: eVenue,
        registrationDeadline: eDeadline ? new Date(eDeadline).toISOString() : undefined,
        seats: eSeats ? Number(eSeats) : undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      showToast("Failed to create event", "error");
      return;
    }

    setETitle("");
    setEDescription("");
    setEVenue("");
    setEDeadline("");
    setESeats("");
    fetchEvents();
    showToast("Event created", "success");
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Faculty Dashboard</h1>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="px-4 py-2 rounded border border-neutral-700 text-sm"
          >
            Log out
          </button>
        </div>
      </div>

      {/* ===== ATTENDANCE SECTION ===== */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold border-b border-neutral-800 pb-2">Attendance</h2>

        <div className="border border-neutral-800 rounded p-4 max-w-md">
          <h3 className="text-lg font-semibold mb-3">Create Attendance Session</h3>
          <form onSubmit={handleCreateSession} className="space-y-3">
            <input
              type="text"
              placeholder="Subject (e.g. Data Structures)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-2 rounded bg-neutral-900 border border-neutral-700"
              required
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 rounded bg-neutral-900 border border-neutral-700"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded bg-white text-black font-semibold disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Session"}
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Your Sessions</h3>
          <div className="space-y-2">
            {sessions.length === 0 && <p className="text-neutral-500">No sessions yet.</p>}
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between border border-neutral-800 rounded p-3">
                <span>{s.subject} — {s.date}</span>
                <button
                  onClick={() => openMarkingFor(s.id)}
                  className="px-3 py-1 rounded border border-neutral-700 text-sm"
                >
                  Mark Attendance
                </button>
              </div>
            ))}
          </div>
        </div>

        {activeSessionId && (
          <div className="border border-neutral-800 rounded p-4 max-w-md">
            <h3 className="text-lg font-semibold mb-3">Mark Attendance</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {students.map((s) => (
                <label key={s.id} className="flex items-center justify-between p-2 border border-neutral-800 rounded">
                  <span>{s.name}</span>
                  <input
                    type="checkbox"
                    checked={attendance[s.id] || false}
                    onChange={(e) => setAttendance({ ...attendance, [s.id]: e.target.checked })}
                  />
                </label>
              ))}
            </div>
            <button
              onClick={handleSaveAttendance}
              disabled={loading}
              className="mt-3 px-4 py-2 rounded bg-white text-black font-semibold disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        )}
      </section>

      {/* ===== ASSIGNMENTS SECTION ===== */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold border-b border-neutral-800 pb-2">Assignments</h2>

        <div className="border border-neutral-800 rounded p-4 max-w-md">
          <h3 className="text-lg font-semibold mb-3">Create Assignment</h3>
          <form onSubmit={handleCreateAssignment} className="space-y-3">
            <input
              type="text"
              placeholder="Title"
              value={aTitle}
              onChange={(e) => setATitle(e.target.value)}
              className="w-full p-2 rounded bg-neutral-900 border border-neutral-700"
              required
            />
            <textarea
              placeholder="Description"
              value={aDescription}
              onChange={(e) => setADescription(e.target.value)}
              className="w-full p-2 rounded bg-neutral-900 border border-neutral-700"
              rows={3}
            />
            <input
              type="datetime-local"
              value={aDeadline}
              onChange={(e) => setADeadline(e.target.value)}
              className="w-full p-2 rounded bg-neutral-900 border border-neutral-700"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded bg-white text-black font-semibold disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Assignment"}
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Your Assignments</h3>
          <div className="space-y-2">
            {assignments.length === 0 && <p className="text-neutral-500">No assignments yet.</p>}
            {assignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between border border-neutral-800 rounded p-3">
                <span>{a.title} — due {new Date(a.deadline).toLocaleString()}</span>
                <button
                  onClick={() => openSubmissionsFor(a.id)}
                  className="px-3 py-1 rounded border border-neutral-700 text-sm"
                >
                  View Submissions
                </button>
              </div>
            ))}
          </div>
        </div>

        {activeAssignmentId && (
          <div className="border border-neutral-800 rounded p-4 max-w-2xl">
            <h3 className="text-lg font-semibold mb-3">Submissions</h3>
            {submissions.length === 0 && <p className="text-neutral-500">No submissions yet.</p>}
            <div className="space-y-3">
              {submissions.map((s) => (
                <div key={s.id} className="border border-neutral-800 rounded p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">{s.studentName}</span>
                    <span className="text-sm text-neutral-400">{s.status}</span>
                  </div>
                  {s.githubLink && (
                    <a href={s.githubLink} target="_blank" className="text-sm underline block">
                      {s.githubLink}
                    </a>
                  )}
                  {s.fileUrl && (
                    <a href={s.fileUrl} target="_blank" className="text-sm underline block">
                      {s.fileUrl}
                    </a>
                  )}
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="Marks"
                      value={reviewDrafts[s.id]?.marks || ""}
                      onChange={(e) =>
                        setReviewDrafts({
                          ...reviewDrafts,
                          [s.id]: { ...reviewDrafts[s.id], marks: e.target.value },
                        })
                      }
                      className="w-24 p-1 rounded bg-neutral-900 border border-neutral-700 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Feedback"
                      value={reviewDrafts[s.id]?.feedback || ""}
                      onChange={(e) =>
                        setReviewDrafts({
                          ...reviewDrafts,
                          [s.id]: { ...reviewDrafts[s.id], feedback: e.target.value },
                        })
                      }
                      className="flex-1 p-1 rounded bg-neutral-900 border border-neutral-700 text-sm"
                    />
                    <button
                      onClick={() => handleReview(s.id)}
                      className="px-3 py-1 rounded bg-white text-black text-sm font-semibold"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ===== EVENTS SECTION ===== */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold border-b border-neutral-800 pb-2">Events</h2>

        <div className="border border-neutral-800 rounded p-4 max-w-md">
          <h3 className="text-lg font-semibold mb-3">Create Event</h3>
          <form onSubmit={handleCreateEvent} className="space-y-3">
            <input
              type="text"
              placeholder="Event title"
              value={eTitle}
              onChange={(e) => setETitle(e.target.value)}
              className="w-full p-2 rounded bg-neutral-900 border border-neutral-700"
              required
            />
            <textarea
              placeholder="Description"
              value={eDescription}
              onChange={(e) => setEDescription(e.target.value)}
              className="w-full p-2 rounded bg-neutral-900 border border-neutral-700"
              rows={2}
            />
            <input
              type="text"
              placeholder="Venue"
              value={eVenue}
              onChange={(e) => setEVenue(e.target.value)}
              className="w-full p-2 rounded bg-neutral-900 border border-neutral-700"
            />
            <input
              type="datetime-local"
              value={eDeadline}
              onChange={(e) => setEDeadline(e.target.value)}
              className="w-full p-2 rounded bg-neutral-900 border border-neutral-700"
            />
            <input
              type="number"
              placeholder="Seats available"
              value={eSeats}
              onChange={(e) => setESeats(e.target.value)}
              className="w-full p-2 rounded bg-neutral-900 border border-neutral-700"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded bg-white text-black font-semibold disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Event"}
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">All Events</h3>
          <div className="space-y-2">
            {eventsList.length === 0 && <p className="text-neutral-500">No events yet.</p>}
            {eventsList.map((ev) => (
              <div key={ev.id} className="border border-neutral-800 rounded p-3">
                <p className="font-semibold">{ev.title}</p>
                <p className="text-sm text-neutral-400">
                  {ev.venue} {ev.seats ? `— ${ev.seats} seats` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}