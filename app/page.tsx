import Link from "next/link";

export default function LandingPage() {
  const features = [
    {
      title: "Attendance, simplified",
      desc: "Faculty mark sessions in seconds. Students see real-time percentage and history — no more spreadsheet chases.",
    },
    {
      title: "Assignments that don't get lost",
      desc: "Upload, submit, review, and grade — all in one place, with deadlines and late-submission tracking built in.",
    },
    {
      title: "Events with real tickets",
      desc: "Create an event, students register, and get a scannable QR pass instantly. No more WhatsApp group chaos.",
    },
    {
      title: "One dashboard per role",
      desc: "Students, faculty, and admins each get a view built for what they actually need to do.",
    },
  ];

  const faqs = [
    {
      q: "Who is Calypso for?",
      a: "Colleges and universities that want to replace scattered WhatsApp groups and spreadsheets with one centralized platform for students, faculty, and admins.",
    },
    {
      q: "Is my data secure?",
      a: "Passwords are hashed, routes are protected by role-based access control, and every action is validated server-side before it touches the database.",
    },
    {
      q: "Can I sign in with Google?",
      a: "Yes — Calypso supports both Google OAuth and email/password sign-in.",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-neutral-900">
        <span className="text-xl font-bold tracking-tight">Calypso</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-neutral-300 hover:text-white">
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm px-4 py-2 rounded bg-white text-black font-semibold hover:bg-neutral-200"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 md:px-12 py-24 md:py-32 max-w-4xl">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
          Your entire campus, <br className="hidden md:block" />
          in one place.
        </h1>
        <p className="text-lg text-neutral-400 mb-8 max-w-xl">
          Attendance, assignments, events, and notices — Calypso replaces the
          disconnected tools colleges use today with one platform built for
          students, faculty, and admins.
        </p>
        <div className="flex gap-4">
          <Link
            href="/signup"
            className="px-6 py-3 rounded bg-white text-black font-semibold hover:bg-neutral-200"
          >
            Create your account
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 rounded border border-neutral-700 hover:border-neutral-500"
          >
            Log in
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 md:px-12 py-12 border-y border-neutral-900 grid grid-cols-2 md:grid-cols-4 gap-6">
        <Stat value="4" label="Core modules" />
        <Stat value="4" label="Role-based dashboards" />
        <Stat value="100%" label="Server-validated actions" />
        <Stat value="1" label="Place for everything" />
      </section>

      {/* Features */}
      <section className="px-6 md:px-12 py-24">
        <h2 className="text-3xl font-bold mb-4">Built for how campuses actually work</h2>
        <p className="text-neutral-400 mb-12 max-w-xl">
          No more chasing five different apps for five different things.
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((f) => (
            <div key={f.title} className="border border-neutral-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-neutral-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 md:px-12 py-24 border-t border-neutral-900">
        <h2 className="text-3xl font-bold mb-12">Frequently asked questions</h2>
        <div className="space-y-6 max-w-2xl">
          {faqs.map((f) => (
            <div key={f.q} className="border-b border-neutral-900 pb-6">
              <h3 className="font-semibold mb-2">{f.q}</h3>
              <p className="text-neutral-400">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-12 border-t border-neutral-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <span className="text-neutral-500 text-sm">
          © {new Date().getFullYear()} Calypso. Built for DevFusion 4.0.
        </span>
        <div className="flex gap-6 text-sm text-neutral-400">
          <Link href="/login" className="hover:text-white">Log in</Link>
          <Link href="/signup" className="hover:text-white">Sign up</Link>
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm text-neutral-500">{label}</p>
    </div>
  );
}