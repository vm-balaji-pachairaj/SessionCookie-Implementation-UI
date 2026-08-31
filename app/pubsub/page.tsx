'use client';

import { Container, Box, Tabs, Tab, Typography } from '@mui/material';
import { useState } from 'react';
import PubSubProducerComponent from '@/component/PubSubProducer';
import PubSubSubscriberComponent from '@/component/PubSubSubscriber';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`pubsub-tabpanel-${index}`}
      aria-labelledby={`pubsub-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `pubsub-tab-${index}`,
    'aria-controls': `pubsub-tabpanel-${index}`,
  };
}

export default function PubSubPage() {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ width: '100%', pt: 4 }}>
        <Typography variant="h3" sx={{ mb: 2, fontWeight: 'bold' }}>
          🔄 Google Cloud Pub/Sub Demo
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
          Publish messages to Google Cloud Pub/Sub and consume them in real-time
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="pubsub tabs">
            <Tab label="📨 Producer" {...a11yProps(0)} />
            <Tab label="🔔 Subscriber" {...a11yProps(1)} />
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <PubSubProducerComponent />
        </TabPanel>

        <TabPanel value={value} index={1}>
          <PubSubSubscriberComponent />
        </TabPanel>
      </Box>
    </Container>
  );
}
