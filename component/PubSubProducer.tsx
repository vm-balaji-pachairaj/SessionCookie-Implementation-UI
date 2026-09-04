'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Chip,
} from '@mui/material';
import axios from 'axios';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const AnyGrid: any = Grid;
const AnyTextField: any = TextField;

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
  const [statusLoading, setStatusLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Fetch PubSub status on component mount
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      setStatusLoading(true);
      const response = await axios.get<StatusResponse>(
        `${API_URL}/api/pubsub/status`,
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
      // Parse metadata JSON
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
        payload,
      );

      setMessage({
        type: 'success',
        text: `Message published successfully! ID: ${response.data.messageId}`,
      });

      // Add to history
      setPublishHistory((prev) => [response.data, ...prev].slice(0, 10));

      // Reset form
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
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        📡 Google Cloud Pub/Sub Producer
      </Typography>

      <AnyGrid container spacing={3}>
        {/* Status Card */}
        <AnyGrid item xs={12}>
          <Card>
            <CardHeader
              title="Pub/Sub Status"
              subheader={statusLoading ? 'Loading...' : 'Real-time connection status'}
            />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {status?.connected ? (
                  <>
                    <CheckCircleIcon sx={{ color: 'green', fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6" sx={{ color: 'green' }}>
                        Connected
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Topic: {status?.details?.topicName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Subscription: {status?.details?.subscriptionName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Active Handlers: {status?.details?.messageHandlersCount}
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <>
                    <ErrorIcon sx={{ color: 'red', fontSize: 40 }} />
                    <Typography variant="h6" sx={{ color: 'red' }}>
                      Disconnected
                    </Typography>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </AnyGrid>

        {/* Main Publisher Card */}
        <AnyGrid item xs={12} md={8}>
          <Card>
            <CardHeader
              title="Publish Message"
              subheader="Send a message to the Pub/Sub topic"
            />
            <Divider />
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {message && (
                <Alert severity={message.type === 'success' ? 'success' : 'error'}>
                  {message.text}
                </Alert>
              )}

              <TextField
                label="Event Type"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                fullWidth
                size="small"
                select
                slotProps={{
                  select: {
                    native: true,
                  },
                }}
              >
                <option value="SESSION_CREATED">SESSION_CREATED</option>
                <option value="SESSION_UPDATED">SESSION_UPDATED</option>
                <option value="USER_ACTION">USER_ACTION</option>
                <option value="COOKIE_SYNC">COOKIE_SYNC</option>
              </TextField>

              <TextField
                label="User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                fullWidth
                size="small"
                placeholder="e.g., user-123"
              />

              <TextField
                label="Session ID"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                fullWidth
                size="small"
                placeholder="e.g., session-456"
              />

              <TextField
                label="Metadata (JSON)"
                value={metadata}
                onChange={(e) => setMetadata(e.target.value)}
                fullWidth
                multiline
                rows={4}
                size="small"
                placeholder='{"key":"value"}'
              />

              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handlePublish}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                sx={{ py: 1.5 }}
              >
                {loading ? 'Publishing...' : 'Publish Message'}
              </Button>
            </CardContent>
          </Card>
        </AnyGrid>

        {/* Dummy Events Card */}
        <AnyGrid item xs={12} md={4}>
          <Card>
            <CardHeader
              title="Quick Load"
              subheader="Load dummy events"
            />
            <Divider />
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {dummyEvents.map((event, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  size="small"
                  onClick={() => loadDummyEvent(event)}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  {event.eventType}
                </Button>
              ))}
            </CardContent>
          </Card>
        </AnyGrid>

        {/* Publish History */}
        {publishHistory.length > 0 && (
          <AnyGrid item xs={12}>
            <Card>
              <CardHeader
                title="Recent Publishes"
                subheader={`Last ${publishHistory.length} messages`}
              />
              <Divider />
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {publishHistory.map((item) => (
                    <Box
                      key={item.messageId}
                      sx={{
                        p: 2,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {item.messageId}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {new Date(item.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                      <Chip label="Published" color="success" size="small" />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </AnyGrid>
        )}
      </AnyGrid>
    </Box>
  );
}
