"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
  let message = "Signup failed";
  if (typeof data.error === "string") {
    message = data.error;
  } else if (data.error?.fieldErrors) {
    const firstField = Object.values(data.error.fieldErrors)[0];
    if (Array.isArray(firstField) && firstField.length > 0) {
      message = firstField[0] as string;
    }
  }
  setError(message);
  return;
}

    // Auto sign-in after signup
    await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: true,
      callbackUrl: "/student",
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 p-6">
        <h1 className="text-2xl font-bold">Create your account</h1>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <input
          type="text"
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full p-2 rounded bg-neutral-900 border border-neutral-700"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full p-2 rounded bg-neutral-900 border border-neutral-700"
          required
        />
        <input
          type="password"
          placeholder="Password (min 8 chars)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full p-2 rounded bg-neutral-900 border border-neutral-700"
          required
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="w-full p-2 rounded bg-neutral-900 border border-neutral-700"
        >
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 rounded bg-white text-black font-semibold disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/student" })}
          className="w-full p-2 rounded border border-neutral-700"
        >
          Continue with Google
        </button>
      </form>
    </div>
  );
}