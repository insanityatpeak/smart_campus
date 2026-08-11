"use client";

import { useEffect, useState } from "react";

type Event = {
  id: string;
  title: string;
  description: string | null;
  venue: string | null;
  registrationDeadline: string | null;
  seats: number | null;
};

type Registration = {
  id: string;
  eventId: string;
  status: string;
  qrCode: string | null;
};

export default function StudentEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchEvents();
    fetchRegistrations();
  }, []);

  async function fetchEvents() {
    const res = await fetch("/api/events");
    const data = await res.json();
    if (res.ok) setEvents(data.events);
  }

  async function fetchRegistrations() {
    const res = await fetch("/api/events/register");
    const data = await res.json();
    if (res.ok) setRegistrations(data.registrations);
  }

  function registrationFor(eventId: string) {
    return registrations.find(
      (r) => r.eventId === eventId && r.status === "registered"
    );
  }

  async function handleRegister(eventId: string) {
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/events/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });

    setLoading(false);

    if (res.ok) {
      setMessage("Registered successfully");
      fetchRegistrations();
    } else {
      setMessage("Registration failed");
    }
  }

  async function handleCancel(registrationId: string) {
    setLoading(true);
    const res = await fetch("/api/events/register", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId }),
    });
    setLoading(false);

    if (res.ok) {
      setMessage("Registration cancelled");
      fetchRegistrations();
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold border-b border-neutral-800 pb-2">Events</h2>

      {message && <p className="text-sm text-green-400">{message}</p>}

      <div className="space-y-3">
        {events.length === 0 && <p className="text-neutral-500">No events yet.</p>}
        {events.map((ev) => {
          const reg = registrationFor(ev.id);
          return (
            <div key={ev.id} className="border border-neutral-800 rounded p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{ev.title}</p>
                  <p className="text-sm text-neutral-400">
                    {ev.venue} {ev.seats ? `— ${ev.seats} seats` : ""}
                  </p>
                </div>
                {reg ? (
                  <button
                    onClick={() => handleCancel(reg.id)}
                    disabled={loading}
                    className="px-3 py-1 rounded border border-red-800 text-red-400 text-sm"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={() => handleRegister(ev.id)}
                    disabled={loading}
                    className="px-3 py-1 rounded bg-white text-black text-sm font-semibold"
                  >
                    Register
                  </button>
                )}
              </div>

              {ev.description && (
                <p className="text-sm text-neutral-300">{ev.description}</p>
              )}

              {reg && reg.qrCode && (
                <div className="pt-2 border-t border-neutral-800">
                  <p className="text-sm text-neutral-400 mb-1">Your ticket:</p>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                      reg.qrCode
                    )}`}
                    alt="Event QR ticket"
                    className="rounded bg-white p-1"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}