"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/upload");
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading state while checking authentication
  if (isLoaded && isSignedIn) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto mb-4"></div>
          <p className="text-neutral-600">Redirecting to app...</p>
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center px-6">
        <h1 className="text-4xl font-bold text-neutral-900 mb-6">
          ThinkNote AI
        </h1>
        <p className="text-xl text-neutral-600 mb-8">
          The #1 AI Study & Learning Companion. Never cram blindly again.
        </p>
        <div className="space-y-4">
          <div className="space-x-4">
            <a
              href="/sign-in"
              className="inline-block bg-neutral-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-neutral-800 transition-colors"
            >
              Sign In
            </a>
            <a
              href="/sign-up"
              className="inline-block border border-neutral-300 text-neutral-700 px-8 py-3 rounded-xl font-medium hover:bg-neutral-100 transition-colors"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
