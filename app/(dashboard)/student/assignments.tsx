"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  deadline: string;
};

type Submission = {
  id: string;
  status: string;
  marks: number | null;
  feedback: string | null;
  fileUrl: string | null;
  githubLink: string | null;
};

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const [githubLink, setGithubLink] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetch("/api/assignments")
      .then((res) => res.json())
      .then((data) => setAssignments(data.assignments || []));
  }, []);

  async function openAssignment(id: string) {
    setActiveId(id);
    const res = await fetch(`/api/submissions?assignmentId=${id}`);
    const data = await res.json();
    setMySubmission(data.submission);
    setGithubLink(data.submission?.githubLink || "");
    setFileUrl(data.submission?.fileUrl || "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId) return;
    setLoading(true);

    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId: activeId, githubLink, fileUrl }),
    });

    setLoading(false);

    if (res.ok) {
      showToast("Submitted successfully", "success");
      openAssignment(activeId);
    } else {
      showToast("Submission failed", "error");
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold border-b border-neutral-800 pb-2">Assignments</h2>

      <div className="space-y-2">
        {assignments.length === 0 && <p className="text-neutral-500">No assignments yet.</p>}
        {assignments.map((a) => (
          <div key={a.id} className="border border-neutral-800 rounded p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{a.title}</p>
                <p className="text-sm text-neutral-400">
                  Due {new Date(a.deadline).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => openAssignment(a.id)}
                className="px-3 py-1 rounded border border-neutral-700 text-sm"
              >
                {activeId === a.id ? "Close" : "Open"}
              </button>
            </div>

            {activeId === a.id && (
              <div className="mt-4 pt-4 border-t border-neutral-800 space-y-3">
                {a.description && <p className="text-sm text-neutral-300">{a.description}</p>}

                {mySubmission?.status === "reviewed" ? (
                  <div className="bg-neutral-900 p-3 rounded space-y-1">
                    <p className="text-green-400 font-semibold">
                      Reviewed — Marks: {mySubmission.marks}/100
                    </p>
                    {mySubmission.feedback && (
                      <p className="text-sm text-neutral-400">
                        Feedback: {mySubmission.feedback}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {mySubmission && (
                      <p className="text-sm text-yellow-400">
                        Status: {mySubmission.status} (you can resubmit below)
                      </p>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-2">
                      <input
                        type="text"
                        placeholder="GitHub link (optional)"
                        value={githubLink}
                        onChange={(e) => setGithubLink(e.target.value)}
                        className="w-full p-2 rounded bg-neutral-900 border border-neutral-700 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="File URL (optional, e.g. Google Drive link)"
                        value={fileUrl}
                        onChange={(e) => setFileUrl(e.target.value)}
                        className="w-full p-2 rounded bg-neutral-900 border border-neutral-700 text-sm"
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 rounded bg-white text-black font-semibold text-sm disabled:opacity-50"
                      >
                        {loading ? "Submitting..." : mySubmission ? "Resubmit" : "Submit"}
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}