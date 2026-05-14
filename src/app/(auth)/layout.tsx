import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk - StoryForge AI",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#7BC043]/5 via-background to-[#FF7F32]/5 p-4">
      {/* Logo */}
      <Link href="/" className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7BC043] to-[#FF7F32] text-2xl font-bold text-white shadow-lg">
          S
        </div>
        <span className="text-lg font-bold tracking-tight">StoryForge AI</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
