"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { signOut } from "next-auth/react";

type Stats = {
  users: { totalStudents: number; totalFaculty: number; totalCoordinators: number; totalAdmins: number; total: number };
  attendance: { totalRecords: number; presentRecords: number; overallPercent: number };
  assignments: { totalAssignments: number; totalSubmissions: number; reviewedSubmissions: number; lateSubmissions: number };
  events: { totalEvents: number; totalRegistrations: number };
};

const COLORS = ["#ffffff", "#a3a3a3", "#525252", "#262626"];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <p className="text-neutral-500">Loading dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <p className="text-red-500">Failed to load stats. Are you logged in as admin?</p>
      </div>
    );
  }

  const roleData = [
    { name: "Students", value: stats.users.totalStudents },
    { name: "Faculty", value: stats.users.totalFaculty },
    { name: "Coordinators", value: stats.users.totalCoordinators },
    { name: "Admins", value: stats.users.totalAdmins },
  ];

  const assignmentData = [
    { name: "Total", value: stats.assignments.totalAssignments },
    { name: "Submissions", value: stats.assignments.totalSubmissions },
    { name: "Reviewed", value: stats.assignments.reviewedSubmissions },
    { name: "Late", value: stats.assignments.lateSubmissions },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-8 space-y-10">
      <div className="flex items-center justify-between">
  <h1 className="text-2xl font-bold">Admin Dashboard</h1>
  <button
    onClick={() => signOut({ callbackUrl: "/" })}
    className="px-4 py-2 rounded border border-neutral-700 text-sm"
  >
    Log out
  </button>
</div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.users.total} />
        <StatCard label="Students" value={stats.users.totalStudents} />
        <StatCard label="Faculty" value={stats.users.totalFaculty} />
        <StatCard label="Attendance %" value={`${stats.attendance.overallPercent}%`} />
        <StatCard label="Assignments" value={stats.assignments.totalAssignments} />
        <StatCard label="Submissions" value={stats.assignments.totalSubmissions} />
        <StatCard label="Events" value={stats.events.totalEvents} />
        <StatCard label="Registrations" value={stats.events.totalRegistrations} />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="border border-neutral-800 rounded p-4">
          <h2 className="text-lg font-semibold mb-4">Users by Role</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {roleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-neutral-800 rounded p-4">
          <h2 className="text-lg font-semibold mb-4">Assignment Stats</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={assignmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="name" stroke="#a3a3a3" />
              <YAxis stroke="#a3a3a3" />
              <Tooltip contentStyle={{ backgroundColor: "#171717", border: "1px solid #404040" }} />
              <Bar dataKey="value" fill="#ffffff" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-neutral-800 rounded p-4">
      <p className="text-sm text-neutral-400">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}