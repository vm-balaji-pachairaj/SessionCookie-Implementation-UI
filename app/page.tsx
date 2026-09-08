'use client';

import Link from 'next/link';
import {
  ShieldIcon,
  PaperPlaneIcon,
  LockIcon,
  CheckIcon,
  ChevronRightIcon,
} from '@/components/ui/Icons';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-white font-sans text-neutral-900 px-4 py-12">
      <main className="w-full max-w-3xl">
        {/* Brand Header */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-1 text-xs font-semibold text-neutral-600">
            <span className="h-2 w-2 rounded-full bg-[#C81E1E]" />
            Enterprise Access &amp; Messaging
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-900">
            Session Cookie &amp; PubSub POC
          </h1>
          <p className="text-sm text-neutral-500 max-w-lg mx-auto leading-relaxed">
            Scalable enterprise session management, Casbin RBAC authorization matrix, and Google Cloud Pub/Sub messaging pipeline.
          </p>
        </div>

        {/* Navigation Cards (Restrained Greyish Palette) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Login Card */}
          <Link
            href="/login"
            className="group relative flex flex-col justify-between p-6 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-400 hover:shadow-sm transition-all duration-150"
          >
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800 group-hover:bg-neutral-900 group-hover:text-white transition-colors duration-150 mb-4">
                <LockIcon size={20} />
              </div>
              <h3 className="font-bold text-sm text-neutral-900">
                User Authentication
              </h3>
              <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                Secure cookie session login with multi-role access control.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-neutral-900">
              <span>Sign In</span>
              <ChevronRightIcon size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Pub/Sub Logs Card */}
          <Link
            href="/pubsub"
            className="group relative flex flex-col justify-between p-6 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-400 hover:shadow-sm transition-all duration-150"
          >
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800 group-hover:bg-neutral-900 group-hover:text-white transition-colors duration-150 mb-4">
                <PaperPlaneIcon size={20} />
              </div>
              <h3 className="font-bold text-sm text-neutral-900">
                Pub/Sub Messaging
              </h3>
              <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                Publish and consume real-time Google Cloud messages.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-neutral-900">
              <span>Explore Stream</span>
              <ChevronRightIcon size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Admin Console Card */}
          <Link
            href="/admin"
            className="group relative flex flex-col justify-between p-6 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-400 hover:shadow-sm transition-all duration-150"
          >
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800 group-hover:bg-[#C81E1E] group-hover:text-white transition-colors duration-150 mb-4">
                <ShieldIcon size={20} />
              </div>
              <h3 className="font-bold text-sm text-neutral-900">
                Admin Console
              </h3>
              <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                Inspect and administer Casbin roles, policy bundles, and rules.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-neutral-900">
              <span>Open Console</span>
              <ChevronRightIcon size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Feature Highlights (Greyish neutral styling) */}
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
            Core Architecture Capabilities
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-neutral-700">
            <div className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-200 text-neutral-700">
                <CheckIcon size={10} />
              </span>
              <span>HttpOnly Session Cookie Authentication &amp; Rotation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-200 text-neutral-700">
                <CheckIcon size={10} />
              </span>
              <span>Casbin RBAC Matrix (P, P2, P3, G, G3 enforcement)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-200 text-neutral-700">
                <CheckIcon size={10} />
              </span>
              <span>Real-Time Google Cloud Pub/Sub Pipeline</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-200 text-neutral-700">
                <CheckIcon size={10} />
              </span>
              <span>Multi-Tab Session Synchronization &amp; Idle Timeout</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-neutral-400">
          Built with Next.js App Router, NestJS Backend, and Casbin Authorization.
        </div>
      </main>
    </div>
  );
}
