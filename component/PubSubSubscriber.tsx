'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshIcon, CheckIcon } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface PubSubMessage {
  data: Record<string, any>;
  timestamp?: string;
  id?: string;
  ackId?: string;
}

interface SubscriberStats {
  totalMessages: number;
  maxSize: number;
  utilizationPercent: number;
}

export default function PubSubSubscriberComponent() {
  const [recentMessages, setRecentMessages] = useState<PubSubMessage[]>([]);
  const [stats] = useState<SubscriberStats | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [_loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchingMessages, setFetchingMessages] = useState(false);
  const [processingMessageId, setProcessingMessageId] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchMessages = async () => {
    try {
      setFetchingMessages(true);
      setError(null);
      const response = await axios.get(`${API_URL}/api/pubsub/messages`);
      if (response.data.messages) {
        setRecentMessages(response.data.messages);
      }
    } catch (err) {
      setError('Failed to fetch messages from Pub/Sub');
      console.error(err);
    } finally {
      setFetchingMessages(false);
    }
  };

  const acknowledgeMessage = async (messageId: string, ackId: string) => {
    try {
      setProcessingMessageId(messageId);
      await axios.post(`${API_URL}/api/pubsub/ack`, {
        messageId,
        ackId,
      });
      setRecentMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      setError(null);
    } catch (err) {
      setError(`Failed to acknowledge message ${messageId}`);
      console.error(err);
    } finally {
      setProcessingMessageId(null);
    }
  };

  const nackMessage = async (messageId: string, ackId: string) => {
    try {
      setProcessingMessageId(messageId);
      await axios.post(`${API_URL}/api/pubsub/nack`, {
        messageId,
        ackId,
      });
      setRecentMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      setError(null);
    } catch (err) {
      setError(`Failed to nack message ${messageId}`);
      console.error(err);
    } finally {
      setProcessingMessageId(null);
    }
  };

  useEffect(() => {
    const checkStatus = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/pubsub/status`);
        if (response.data.connected) {
          setIsListening(true);
        }
      } catch (err) {
        setError('Failed to connect to Pub/Sub');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Subscriber Status & Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Subscriber Daemon
          </span>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isListening ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-300'
              }`}
            />
            <h3 className="text-base font-bold text-neutral-900">
              {isListening ? 'Active & Listening' : 'Connecting to topic…'}
            </h3>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {isListening
              ? 'Real-time subscription handler attached to cloud topic.'
              : 'Establishing gRPC connection…'}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Queue Buffer Stats
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900">
              {stats?.totalMessages || 0}
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              / {stats?.maxSize || 1000} capacity
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {stats?.utilizationPercent?.toFixed(1) || 0}% queue utilization
          </p>
        </div>
      </div>

      {/* Received Messages Stream */}
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Incoming Messages Stream</h3>
            <p className="text-xs text-neutral-500">Unacknowledged message payloads</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchMessages}
            isLoading={fetchingMessages}
            leftIcon={<RefreshIcon size={14} />}
          >
            Fetch Messages
          </Button>
        </div>

        <div className="p-6">
          {recentMessages.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              No unacknowledged messages. Click &quot;Fetch Messages&quot; to pull from subscription.
            </div>
          ) : (
            <div className="space-y-4">
              {recentMessages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral">{msg.data?.eventType || 'MESSAGE'}</Badge>
                      <span className="font-mono text-xs text-neutral-500">
                        ID: {msg.id || 'N/A'}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400">
                      {msg.timestamp
                        ? new Date(msg.timestamp).toLocaleTimeString()
                        : 'Just now'}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-neutral-700">
                    <p>
                      <span className="font-semibold text-neutral-500">User ID:</span>{' '}
                      <span className="font-mono text-neutral-900">{msg.data?.userId || 'N/A'}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-neutral-500">Session ID:</span>{' '}
                      <span className="font-mono text-neutral-900">{msg.data?.sessionId || 'N/A'}</span>
                    </p>

                    {msg.data?.metadata && (
                      <div className="mt-2">
                        <span className="font-semibold text-neutral-500 block mb-1">
                          Metadata JSON:
                        </span>
                        <pre className="rounded-lg border border-neutral-200 bg-white p-2.5 font-mono text-[11px] text-neutral-800 overflow-x-auto">
                          {JSON.stringify(msg.data.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* ACK & NACK controls */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        acknowledgeMessage(msg.id || '', msg.ackId || '')
                      }
                      isLoading={processingMessageId === msg.id}
                      leftIcon={<CheckIcon size={12} />}
                    >
                      Acknowledge (ACK)
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        nackMessage(msg.id || '', msg.ackId || '')
                      }
                      disabled={processingMessageId === msg.id}
                    >
                      Negative Ack (NACK)
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
