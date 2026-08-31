'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  Button,
  ButtonGroup,
} from '@mui/material';
import axios from 'axios';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import StorageIcon from '@mui/icons-material/Storage';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt';

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
  const [stats, setStats] = useState<SubscriberStats | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchingMessages, setFetchingMessages] = useState(false);
  const [processingMessageId, setProcessingMessageId] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Fetch messages from Pub/Sub
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

  // Acknowledge a message
  const acknowledgeMessage = async (messageId: string, ackId: string) => {
    try {
      setProcessingMessageId(messageId);
      await axios.post(`${API_URL}/api/pubsub/ack`, {
        messageId,
        ackId,
      });
      // Remove the message from the list
      setRecentMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      setError(null);
    } catch (err) {
      setError(`Failed to acknowledge message ${messageId}`);
      console.error(err);
    } finally {
      setProcessingMessageId(null);
    }
  };

  // Nack (negative acknowledge) a message
  const nackMessage = async (messageId: string, ackId: string) => {
    try {
      setProcessingMessageId(messageId);
      await axios.post(`${API_URL}/api/pubsub/nack`, {
        messageId,
        ackId,
      });
      // Remove the message from the list
      setRecentMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      setError(null);
    } catch (err) {
      setError(`Failed to nack message ${messageId}`);
      console.error(err);
    } finally {
      setProcessingMessageId(null);
    }
  };

  // Simulate fetching subscriber status
  // In a real app, you would create a separate endpoint to fetch subscriber stats
  useEffect(() => {
    // Check connection and start listening
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

    // Poll for updates every 3 seconds
    const interval = setInterval(() => {
      checkStatus();
      // Here you could also fetch recent messages from a subscriber stats endpoint
      // if you create one in your backend
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'SESSION_CREATED':
        return '📱';
      case 'SESSION_UPDATED':
        return '🔄';
      case 'USER_ACTION':
        return '👆';
      case 'COOKIE_SYNC':
        return '🍪';
      default:
        return '📨';
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        🔔 Google Cloud Pub/Sub Subscriber
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Listening Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Subscriber Status" />
            <Divider />
            <CardContent>
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={40} />
                  <Typography>Checking connection...</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {isListening ? (
                    <>
                      <CheckCircleIcon
                        sx={{ color: 'green', fontSize: 40, animation: 'pulse 2s infinite' }}
                      />
                      <Box>
                        <Typography variant="h6" sx={{ color: 'green' }}>
                          Listening
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Waiting for messages...
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <>
                      <ErrorIcon sx={{ color: 'red', fontSize: 40 }} />
                      <Typography variant="h6" sx={{ color: 'red' }}>
                        Not Connected
                      </Typography>
                    </>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Message Count */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Queue Statistics" />
            <Divider />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <StorageIcon sx={{ color: 'primary.main', fontSize: 40 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Messages in Queue
                  </Typography>
                  <Typography variant="h5">
                    {stats?.totalMessages || 0} / {stats?.maxSize || 1000}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {stats?.utilizationPercent?.toFixed(2) || 0}% utilized
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Messages */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Recent Messages"
              subheader="Last messages received from Pub/Sub"
              action={
                <Button
                  variant="contained"
                  startIcon={<CloudDownloadIcon />}
                  onClick={fetchMessages}
                  disabled={fetchingMessages}
                >
                  {fetchingMessages ? 'Fetching...' : 'Fetch Messages'}
                </Button>
              }
            />
            <Divider />
            <CardContent>
              {recentMessages.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
                  <Typography sx={{ color: 'text.secondary' }}>
                    No messages available. Click "Fetch Messages" to pull messages from Pub/Sub.
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {recentMessages.map((msg, index) => (
                    <Paper
                      key={index}
                      sx={{
                        p: 2,
                        backgroundColor: '#f9f9f9',
                        borderLeft: '4px solid #1976d2',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                          <Typography variant="h6">
                            {getEventIcon(msg.data.eventType)}
                          </Typography>
                          <Chip
                            label={msg.data.eventType}
                            color="primary"
                            variant="outlined"
                            size="small"
                          />
                          <Typography variant="caption" sx={{ color: 'text.secondary', ml: 2 }}>
                            ID: {msg.id || 'N/A'}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {msg.timestamp
                            ? new Date(msg.timestamp).toLocaleTimeString()
                            : 'N/A'}
                        </Typography>
                      </Box>

                      <Box sx={{ ml: 1, mb: 2 }}>
                        <Typography variant="body2">
                          <strong>User ID:</strong> {msg.data.userId || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Session ID:</strong> {msg.data.sessionId || 'N/A'}
                        </Typography>
                        {msg.data.metadata && (
                          <Typography
                            variant="body2"
                            sx={{ mt: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}
                          >
                            <strong>Metadata:</strong>
                            <Box
                              component="pre"
                              sx={{
                                backgroundColor: '#fff',
                                p: 1,
                                borderRadius: 1,
                                overflow: 'auto',
                                maxHeight: '150px',
                                fontSize: '0.75rem',
                              }}
                            >
                              {JSON.stringify(msg.data.metadata, null, 2)}
                            </Box>
                          </Typography>
                        )}
                      </Box>

                      {/* ACK and NACK Buttons */}
                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <ButtonGroup size="small" variant="outlined">
                          <Button
                            color="success"
                            startIcon={<ThumbUpAltIcon />}
                            onClick={() =>
                              acknowledgeMessage(msg.id || '', msg.ackId || '')
                            }
                            disabled={processingMessageId === msg.id}
                          >
                            {processingMessageId === msg.id ? 'Processing...' : 'ACK'}
                          </Button>
                          <Button
                            color="error"
                            startIcon={<ThumbDownAltIcon />}
                            onClick={() => nackMessage(msg.id || '', msg.ackId || '')}
                            disabled={processingMessageId === msg.id}
                          >
                            {processingMessageId === msg.id ? 'Processing...' : 'NACK'}
                          </Button>
                        </ButtonGroup>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <style>{`
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </Box>
  );
}
