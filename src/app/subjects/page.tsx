"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type Lecture = { id: string; title: string; pages: number };
type Subject = { id: string; name: string; lectures: Lecture[] };

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, lectures(id, title, pages, sort_order)")
        .order("created_at", { ascending: true });
      if (error) setMessage("خطأ: " + error.message);
      else setSubjects((data as Subject[]) ?? []);
    }
    load();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white flex justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-3xl font-bold text-center">المواد</h1>
        {message && <p className="text-center text-red-300">{message}</p>}
        {subjects.map((s) => (
          <section key={s.id} className="rounded bg-slate-800 p-4 space-y-2">
            <h2 className="text-xl font-bold">{s.name}</h2>
            <ul className="space-y-1">
              {s.lectures.map((l) => (
                <li key={l.id} className="flex justify-between text-slate-300">
                  <span>{l.title}</span>
                  <span>{l.pages} صفحة</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {subjects.length === 0 && !message && (
          <p className="text-center text-slate-400">لا توجد مواد، أو لم تسجّل الدخول.</p>
        )}
      </div>
    </main>
  );
}
