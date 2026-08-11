"use client";

import { useEffect, useState } from "react";

type AttendanceRecord = {
  id: string;
  present: boolean;
  subject: string;
  date: string;
};

export default function AttendanceSummary() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [percentage, setPercentage] = useState(0);
  const [total, setTotal] = useState(0);
  const [presentCount, setPresentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/attendance/records")
      .then((res) => res.json())
      .then((data) => {
        setRecords(data.records || []);
        setPercentage(data.percentage || 0);
        setTotal(data.total || 0);
        setPresentCount(data.presentCount || 0);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="text-neutral-500">Loading attendance...</p>;
  }

  return (
    <div className="border border-neutral-800 rounded p-4 max-w-md">
      <h2 className="text-lg font-semibold mb-2">Attendance</h2>

      {total === 0 ? (
        <p className="text-neutral-500">No attendance records yet.</p>
      ) : (
        <>
          <p className="text-3xl font-bold mb-1">{percentage}%</p>
          <p className="text-neutral-400 mb-4">
            {presentCount} / {total} classes attended
          </p>

          <div className="space-y-1">
            {records.map((r) => (
              <div
                key={r.id}
                className="flex justify-between text-sm border-b border-neutral-900 py-1"
              >
                <span>
                  {r.subject} — {r.date}
                </span>
                <span className={r.present ? "text-green-400" : "text-red-400"}>
                  {r.present ? "Present" : "Absent"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}