'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 font-sans">
      <main className="w-full max-w-2xl px-6 py-12">
        <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-xl p-12 space-y-8">
          {/* Header */}
          <div className="space-y-3 text-center">
            <h1 className="text-4xl font-bold text-slate-950 dark:text-slate-50">
              Session Cookie POC
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Session management and Pub/Sub messaging demo
            </p>
          </div>

          {/* Description */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 space-y-2">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Welcome!</h2>
            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
              This application demonstrates session cookie management and Google Cloud Pub/Sub messaging.
              Choose an option below to get started.
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Login Button */}
            <Link
              href="/login"
              className="group flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 hover:shadow-lg hover:scale-105"
            >
              <div className="text-4xl">🔐</div>
              <div className="text-center">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  Login
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Access the dashboard with authentication
                </p>
              </div>
            </Link>

            {/* Pub/Sub Logs Button */}
            <Link
              href="/pubsub"
              className="group flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-green-500 dark:hover:border-green-400 transition-all duration-200 hover:shadow-lg hover:scale-105"
            >
              <div className="text-4xl">📨</div>
              <div className="text-center">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-green-600 dark:group-hover:text-green-400">
                  Pub/Sub Logs
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Publish and monitor messages (no auth required)
                </p>
              </div>
            </Link>
          </div>

          {/* Features */}
          <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Features</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                <span>Google Cloud Pub/Sub Integration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                <span>Session Cookie Management</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                <span>Real-time Message Monitoring</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                <span>Public Pub/Sub API (No Auth)</span>
              </li>
            </ul>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-slate-500 dark:text-slate-500 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p>Built with Next.js, NestJS, and Google Cloud Pub/Sub</p>
          </div>
        </div>
      </main>
    </div>
  );
}
