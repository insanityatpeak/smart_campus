"use client";

import { useEffect, useState } from "react";

type Notification = {
  id: string;
  title: string;
  message: string | null;
  read: boolean;
  createdAt: string;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30s for new notifications — simple approach, no websockets needed
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchNotifications() {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    if (res.ok) setNotifications(data.notifications);
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative px-3 py-2 rounded border border-neutral-700 text-sm"
      >
        Notifications
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-neutral-900 border border-neutral-700 rounded shadow-lg z-50">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-neutral-500">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className={`p-3 border-b border-neutral-800 cursor-pointer ${
                  n.read ? "opacity-50" : ""
                }`}
              >
                <p className="text-sm font-semibold">{n.title}</p>
                {n.message && (
                  <p className="text-xs text-neutral-400 mt-1">{n.message}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}