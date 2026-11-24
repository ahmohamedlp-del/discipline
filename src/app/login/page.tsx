"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function signUp() {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    setMessage(error ? "خطأ: " + error.message : "تم إنشاء الحساب. اضغط دخول.");
  }

  async function signIn() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMessage(error ? "خطأ: " + error.message : "تم تسجيل الدخول بنجاح ✅");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-3xl font-bold text-center">تسجيل الدخول</h1>
        <input
          className="w-full rounded bg-slate-800 p-3"
          type="email"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded bg-slate-800 p-3"
          type="password"
          placeholder="كلمة المرور (6 أحرف على الأقل)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={signIn} className="w-full rounded bg-blue-600 p-3 font-bold">
          دخول
        </button>
        <button onClick={signUp} className="w-full rounded bg-slate-700 p-3 font-bold">
          إنشاء حساب جديد
        </button>
        {message && <p className="text-center text-slate-300">{message}</p>}
      </div>
    </main>
  );
}
