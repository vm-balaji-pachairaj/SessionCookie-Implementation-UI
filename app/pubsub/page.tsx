'use client';

import { useState } from 'react';
import Link from 'next/link';
import PubSubProducerComponent from '@/component/PubSubProducer';
import PubSubSubscriberComponent from '@/component/PubSubSubscriber';
import { PaperPlaneIcon, ChevronLeftIcon } from '@/components/ui/Icons';
import { Tabs } from '@/components/ui/Tabs';

export default function PubSubPage() {
  const [activeTab, setActiveTab] = useState<'producer' | 'subscriber'>('producer');

  return (
    <div className="min-h-screen bg-white font-sans text-neutral-900 px-4 sm:px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
          <div>
            <Link
              href="/"
              className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition"
            >
              <ChevronLeftIcon size={14} />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-[#C81E1E]">
                <PaperPlaneIcon size={14} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                Google Cloud Pub/Sub Pipeline
              </h1>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Publish messages to Cloud Pub/Sub topics and inspect subscriber consumption in real time.
            </p>
          </div>

          <Tabs
            items={[
              { id: 'producer', label: 'Message Producer' },
              { id: 'subscriber', label: 'Message Subscriber' },
            ]}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as 'producer' | 'subscriber')}
          />
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'producer' ? (
            <PubSubProducerComponent />
          ) : (
            <PubSubSubscriberComponent />
          )}
        </div>
      </div>
    </div>
  );
}
