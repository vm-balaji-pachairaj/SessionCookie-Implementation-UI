'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PaperPlaneIcon } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface PublishResponse {
  success: boolean;
  messageId: string;
  timestamp: string;
}

interface StatusResponse {
  connected: boolean;
  details: {
    topicName: string;
    subscriptionName: string;
    isConnected: boolean;
    messageHandlersCount: number;
  };
}

export default function PubSubProducerComponent() {
  const [eventType, setEventType] = useState('USER_ACTION');
  const [userId, setUserId] = useState('user-123');
  const [sessionId, setSessionId] = useState('session-456');
  const [metadata, setMetadata] = useState('{"action":"click","page":"dashboard"}');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [publishHistory, setPublishHistory] = useState<PublishResponse[]>([]);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [_statusLoading, setStatusLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      setStatusLoading(true);
      const response = await axios.get<StatusResponse>(
        `${API_URL}/api/pubsub/status`
      );
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    setMessage(null);

    try {
      let parsedMetadata = {};
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch {
        setMessage({
          type: 'error',
          text: 'Invalid JSON format for metadata',
        });
        setLoading(false);
        return;
      }

      const payload = {
        eventType,
        userId,
        sessionId,
        metadata: parsedMetadata,
      };

      const response = await axios.post<PublishResponse>(
        `${API_URL}/api/pubsub/publish`,
        payload
      );

      setMessage({
        type: 'success',
        text: `Message published successfully! ID: ${response.data.messageId}`,
      });

      setPublishHistory((prev) => [response.data, ...prev].slice(0, 10));

      setEventType('USER_ACTION');
      setUserId('user-123');
      setSessionId('session-456');
      setMetadata('{"action":"click","page":"dashboard"}');
    } catch (error) {
      console.error('Error publishing message:', error);
      setMessage({
        type: 'error',
        text:
          axios.isAxiosError(error) && error.response
            ? error.response.data.message || 'Failed to publish message'
            : 'Failed to publish message',
      });
    } finally {
      setLoading(false);
    }
  };

  const dummyEvents = [
    {
      eventType: 'SESSION_CREATED',
      userId: 'user-001',
      sessionId: 'sess-001',
      metadata: '{"browser":"Chrome","ip":"192.168.1.1"}',
    },
    {
      eventType: 'SESSION_UPDATED',
      userId: 'user-002',
      sessionId: 'sess-002',
      metadata: '{"duration":3600,"action":"page_view"}',
    },
    {
      eventType: 'USER_ACTION',
      userId: 'user-003',
      sessionId: 'sess-003',
      metadata: '{"action":"button_click","elementId":"submit-btn"}',
    },
    {
      eventType: 'COOKIE_SYNC',
      userId: 'user-004',
      sessionId: 'sess-004',
      metadata: '{"cookies":{"auth":"token123","theme":"dark"}}',
    },
  ];

  const loadDummyEvent = (event: (typeof dummyEvents)[0]) => {
    setEventType(event.eventType);
    setUserId(event.userId);
    setSessionId(event.sessionId);
    setMetadata(event.metadata);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Connection Status Card */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3 mb-3">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">Topic Connection Status</h2>
            <p className="text-xs text-neutral-500">Real-time status of Cloud Pub/Sub service</p>
          </div>
          <Badge variant={status?.connected ? 'success' : 'neutral'} dot>
            {status?.connected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="font-semibold text-neutral-400">Target Topic:</span>
            <p className="font-mono text-neutral-800 font-medium truncate mt-0.5">
              {status?.details?.topicName || '—'}
            </p>
          </div>
          <div>
            <span className="font-semibold text-neutral-400">Subscription:</span>
            <p className="font-mono text-neutral-800 font-medium truncate mt-0.5">
              {status?.details?.subscriptionName || '—'}
            </p>
          </div>
          <div>
            <span className="font-semibold text-neutral-400">Active Handlers:</span>
            <p className="font-mono text-neutral-800 font-medium mt-0.5">
              {status?.details?.messageHandlersCount ?? 0}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Publish Form (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Publish Message</h3>
            <p className="text-xs text-neutral-500">Construct and send JSON message payload</p>
          </div>

          {message && (
            <div
              className={`rounded-xl border p-3 text-xs font-semibold ${
                message.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Event Type
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50/50 px-3.5 py-2 text-xs font-semibold text-neutral-800 outline-none transition focus:border-neutral-400 focus:bg-white focus:ring-1 focus:ring-neutral-400"
              >
                <option value="SESSION_CREATED">SESSION_CREATED</option>
                <option value="SESSION_UPDATED">SESSION_UPDATED</option>
                <option value="USER_ACTION">USER_ACTION</option>
                <option value="COOKIE_SYNC">COOKIE_SYNC</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  User ID
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g., user-123"
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50/50 px-3.5 py-2 text-xs text-neutral-800 placeholder-neutral-400 outline-none transition focus:border-neutral-400 focus:bg-white focus:ring-1 focus:ring-neutral-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Session ID
                </label>
                <input
                  type="text"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="e.g., session-456"
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50/50 px-3.5 py-2 text-xs text-neutral-800 placeholder-neutral-400 outline-none transition focus:border-neutral-400 focus:bg-white focus:ring-1 focus:ring-neutral-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Metadata (JSON format)
              </label>
              <textarea
                rows={4}
                value={metadata}
                onChange={(e) => setMetadata(e.target.value)}
                placeholder='{"key":"value"}'
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 font-mono text-xs text-neutral-800 placeholder-neutral-400 outline-none transition focus:border-neutral-400 focus:bg-white focus:ring-1 focus:ring-neutral-400"
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handlePublish}
              isLoading={loading}
              className="w-full"
              leftIcon={<PaperPlaneIcon size={16} />}
            >
              Publish Message to Cloud Topic
            </Button>
          </div>
        </div>

        {/* Quick Load Presets (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xs space-y-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Preset Templates</h3>
            <p className="text-xs text-neutral-500">Quick-load test payloads</p>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            {dummyEvents.map((event, index) => (
              <button
                key={index}
                type="button"
                onClick={() => loadDummyEvent(event)}
                className="w-full text-left rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100 p-3 text-xs font-semibold text-neutral-700 transition"
              >
                <span className="font-mono text-neutral-900 block font-bold">
                  {event.eventType}
                </span>
                <span className="text-[11px] text-neutral-400 font-normal">
                  User: {event.userId}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Publish History */}
      {publishHistory.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xs">
          <h3 className="text-sm font-bold text-neutral-900 mb-3">
            Recent Publications ({publishHistory.length})
          </h3>
          <div className="divide-y divide-neutral-100">
            {publishHistory.map((item) => (
              <div
                key={item.messageId}
                className="py-3 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-neutral-900">
                    ID: {item.messageId}
                  </span>
                  <p className="text-[11px] text-neutral-400">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
                <Badge variant="neutral" dot>
                  Dispatched
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
