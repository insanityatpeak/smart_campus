"use client";

import { useEffect, useState } from "react";

type Student = { id: string; name: string; email: string };
type Session = { id: string; subject: string; date: string };

export default function FacultyDashboard() {
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSessions();
    fetchStudents();
  }, []);

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
    setMessage("");

    const res = await fetch("/api/attendance/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, date }),
    });

    setLoading(false);

    if (!res.ok) {
      setMessage("Failed to create session");
      return;
    }

    setSubject("");
    setDate("");
    fetchSessions();
    setMessage("Session created");
  }

  function openMarkingFor(sessionId: string) {
    setActiveSessionId(sessionId);
    // default everyone to absent, faculty flips to present
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
      setMessage("Attendance saved");
      setActiveSessionId(null);
    } else {
      setMessage("Failed to save attendance");
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 space-y-8">
      <h1 className="text-2xl font-bold">Faculty Dashboard</h1>

      {message && <p className="text-green-400">{message}</p>}

      {/* Create session */}
      <div className="border border-neutral-800 rounded p-4 max-w-md">
        <h2 className="text-lg font-semibold mb-3">Create Attendance Session</h2>
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

      {/* List sessions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Your Sessions</h2>
        <div className="space-y-2">
          {sessions.length === 0 && (
            <p className="text-neutral-500">No sessions yet.</p>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between border border-neutral-800 rounded p-3"
            >
              <span>
                {s.subject} — {s.date}
              </span>
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

      {/* Marking panel */}
      {activeSessionId && (
        <div className="border border-neutral-800 rounded p-4 max-w-md">
          <h2 className="text-lg font-semibold mb-3">Mark Attendance</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {students.map((s) => (
              <label
                key={s.id}
                className="flex items-center justify-between p-2 border border-neutral-800 rounded"
              >
                <span>{s.name}</span>
                <input
                  type="checkbox"
                  checked={attendance[s.id] || false}
                  onChange={(e) =>
                    setAttendance({ ...attendance, [s.id]: e.target.checked })
                  }
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
    </div>
  );
}