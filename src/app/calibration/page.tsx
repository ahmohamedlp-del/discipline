"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Subject = { id: string; name: string };
type Lecture = { id: string; title: string; pages: number };
type Step = "estimate" | "confirm" | "trial";

const toNumber = (v: string) =>
  Number(
    v
      .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
      .replace(/[٫,]/g, ".")
  );

const field =
  "w-full rounded-lg border border-slate-300 bg-white p-3 text-lg text-slate-900";
const primary =
  "w-full rounded-lg bg-teal-700 p-3 text-lg font-bold text-white disabled:opacity-50";
const secondary =
  "w-full rounded-lg border border-slate-400 p-3 text-lg text-slate-800 disabled:opacity-50";

export default function CalibrationPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [userId, setUserId] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [lectureId, setLectureId] = useState("");
  const [step, setStep] = useState<Step>("estimate");
  const [hours, setHours] = useState("");
  const [pages, setPages] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.replace("/login");
        return;
      }
      setUserId(auth.user.id);
      const [s, p] = await Promise.all([
        supabase.from("subjects").select("id, name").order("name"),
        supabase.from("speed_profiles").select("subject_id"),
      ]);
      const error = s.error || p.error;
      if (error) setMessage("تعذّر التحميل: " + error.message);
      setSubjects(s.data ?? []);
      setDone((p.data ?? []).map((row) => row.subject_id));
      setLoading(false);
    }
    load();
  }, [router, supabase]);

  async function choose(s: Subject) {
    setSubject(s);
    setStep("estimate");
    setHours("");
    setPages("");
    setLectureId("");
    setLectures([]);
    setMessage("");
    const { data, error } = await supabase
      .from("lectures")
      .select("id, title, pages")
      .eq("subject_id", s.id)
      .order("sort_order");
    if (error) setMessage("تعذّر تحميل المحاضرات: " + error.message);
    setLectures(data ?? []);
  }

  function next() {
    if (!(toNumber(hours) > 0)) {
      setMessage("اكتب عدد ساعات أكبر من صفر.");
      return;
    }
    setMessage("");
    setStep("confirm");
  }

  async function save(source: "estimate" | "trial") {
    if (!subject) return;
    const h = toNumber(hours);
    const n = source === "estimate" ? 6 : toNumber(pages);
    if (!(h > 0) || !Number.isInteger(n) || !(n > 0)) {
      setMessage("اكتب عدد صفحات صحيحًا وعدد ساعات أكبر من صفر.");
      return;
    }
    if (source === "trial" && !lectureId) {
      setMessage("اختر المحاضرة التي جرّبتها.");
      return;
    }
    setSaving(true);
    setMessage("");
    let { error } = await supabase.from("speed_profiles").upsert(
      {
        user_id: userId,
        subject_id: subject.id,
        hours_per_page: h / n,
        source,
      },
      { onConflict: "user_id,subject_id" }
    );
    if (!error && source === "trial") {
      ({ error } = await supabase
        .from("study_sessions")
        .insert({ user_id: userId, lecture_id: lectureId, pages: n, hours: h }));
    }
    setSaving(false);
    if (error) {
      setMessage("تعذّر الحفظ: " + error.message);
      return;
    }
    setDone((d) => [...new Set([...d, subject.id])]);
    setSubject(null);
    setMessage("تم حفظ سرعتك في " + subject.name);
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-2xl font-bold">اعرف سرعتك في المذاكرة</h1>

        {loading && <p>جارٍ التحميل...</p>}

        {!loading && !subject && (
          <>
            <p>اختر مادة:</p>
            {subjects.map((s) => (
              <button key={s.id} className={secondary} onClick={() => choose(s)}>
                {s.name} {done.includes(s.id) ? "✅" : ""}
              </button>
            ))}
          </>
        )}

        {subject && step === "estimate" && (
          <>
            <p className="text-lg">
              محاضرة من 6 صفحات في مادة {subject.name}، كم ساعة تقدّر أنها تأخذ منك؟
            </p>
            <input
              className={field}
              inputMode="decimal"
              placeholder="مثال: 1.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
            <button className={primary} onClick={next}>التالي</button>
          </>
        )}

        {subject && step === "confirm" && (
          <>
            <p className="text-lg">هل أنت متأكد أنها تأخذ {hours} ساعة؟</p>
            <button className={primary} disabled={saving} onClick={() => save("estimate")}>
              نعم، متأكد
            </button>
            <button
              className={secondary}
              disabled={saving}
              onClick={() => {
                setHours("");
                setMessage("");
                setStep("trial");
              }}
            >
              لا، سأجرّب
            </button>
          </>
        )}

        {subject && step === "trial" && (
          <>
            <p className="text-lg">ذاكر محاضرة كاملة، ثم ارجع وسجّل النتيجة.</p>
            {lectures.length === 0 && <p>لا توجد محاضرات في هذه المادة بعد.</p>}
            <select
              className={field}
              value={lectureId}
              onChange={(e) => {
                setLectureId(e.target.value);
                const l = lectures.find((x) => x.id === e.target.value);
                setPages(l ? String(l.pages) : "");
              }}
            >
              <option value="">اختر المحاضرة</option>
              {lectures.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
            <input
              className={field}
              inputMode="numeric"
              placeholder="عدد الصفحات"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
            />
            <input
              className={field}
              inputMode="decimal"
              placeholder="الوقت بالساعات"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
            <button className={primary} disabled={saving} onClick={() => save("trial")}>
              احفظ النتيجة
            </button>
          </>
        )}

        {subject && (
          <button
            className="underline"
            onClick={() => {
              setSubject(null);
              setMessage("");
            }}
          >
            رجوع للمواد
          </button>
        )}

        {message && <p role="status" className="font-bold">{message}</p>}
      </div>
    </main>
  );
}
