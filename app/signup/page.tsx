"use client";

import { createSupabaseBrowser } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">이메일을 확인하세요</h1>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-gray-100">{email}</span>로 확인 링크를 보냈습니다.
            이메일의 링크를 클릭하여 회원가입을 완료하세요.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm font-medium text-gray-900 hover:underline dark:text-gray-100"
          >
            로그인 페이지로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">RAG Chat</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">새 계정을 만드세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-gray-500"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-gray-500"
              placeholder="6자 이상"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gray-900 py-3 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300 dark:focus:ring-gray-500"
          >
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-medium text-gray-900 hover:underline dark:text-gray-100">
            로그인
          </Link>
        </p>
      </div>
    </main>
  );
}
