"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push("/student");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 p-6">
        <h1 className="text-2xl font-bold">Log in</h1>

        {error && <p className="text-red-500 text-sm">{error}</p>}

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
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full p-2 rounded bg-neutral-900 border border-neutral-700"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 rounded bg-white text-black font-semibold disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/student" })}
          className="w-full p-2 rounded border border-neutral-700"
        >
          Continue with Google
        </button>

        <p className="text-sm text-neutral-400 text-center">
          Don't have an account?{" "}
          <a href="/signup" className="underline">
            Sign up
          </a>
        </p>
      </form>
    </div>
  );
}