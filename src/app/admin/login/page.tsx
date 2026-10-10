import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Admin sign in — VPL" };

export default function AdminLogin() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-0 w-[800px] h-[800px] bg-[#990000]/10 blur-[150px] rounded-full opacity-50 mix-blend-screen translate-x-1/3" />
      </div>
      <LoginForm />
    </main>
  );
}
