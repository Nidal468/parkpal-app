'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Apple, Mail } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f0ebf8] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6 relative">
      {/* Main content */}
      <div className="relative z-10 max-w-md w-full">
        {/* Single Card */}
        <div className="w-full bg-[#f0ebf8]/90 dark:bg-gray-900/90 backdrop-blur-lg border border-gray-300/50 dark:border-gray-600/50 rounded-2xl shadow-2xl p-8 space-y-6 text-center">
          {/* Header */}
          <div className="flex items-center justify-center gap-3 bg-white/10 dark:bg-white/5 px-6 py-3 rounded-xl shadow-sm backdrop-blur-md mx-auto w-fit">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">Parkpal</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome to Parkpal</h1>
          <p className="text-gray-700 dark:text-gray-300 max-w-md mx-auto">
            Your smart AI assistant for finding the perfect parking spot — tailored to your needs in real time.
          </p>

          {/* OAuth Buttons */}
          <div className="space-y-4">
            {/* Google */}
            <button
              onClick={() => signIn('google')}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700/60 hover:dark:bg-gray-600/70 border border-gray-300 dark:border-gray-500/50 hover:border-gray-400 text-gray-800 dark:text-gray-100 hover:text-black dark:hover:text-white rounded-xl transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md flex items-center justify-center gap-3"
            >
              <Mail size={20} />
              Sign in with Google
            </button>

            {/* Apple */}
            <button
              onClick={() => signIn('apple')}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700/60 hover:dark:bg-gray-600/70 border border-gray-300 dark:border-gray-500/50 hover:border-gray-400 text-gray-800 dark:text-gray-100 hover:text-black dark:hover:text-white rounded-xl transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md flex items-center justify-center gap-3"
            >
              <Apple size={20} />
              Sign in with Apple
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
