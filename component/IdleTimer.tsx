'use client';

import { Box, Typography } from '@mui/material';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import React from 'react';

interface IdleTimerProps {
  remainingTime: number;
  totalWarningTime: number;
}

const IdleTimer: React.FC<IdleTimerProps> = ({
  remainingTime,
  totalWarningTime,
}) => {
  const totalSeconds = Math.ceil(remainingTime / 1000);

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const formattedTime = `${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const getTimerColor = () => {
    const percentage = (remainingTime / totalWarningTime) * 100;

    if (percentage > 66.67) {
      return '#4CAF50';
    }

    if (percentage > 33.33) {
      return '#FF9800';
    }

    return '#F44336';
  };

  const timerColor = getTimerColor();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.25,
        py: 0.75,
        borderRadius: '8px',
        backgroundColor: `${timerColor}15`,
        border: `1px solid ${timerColor}40`,
        transition: 'all 0.3s ease',
      }}
    >
      <TimerOutlinedIcon
        sx={{
          fontSize: 20,
          color: timerColor,
          transition: 'color 0.3s ease',
        }}
      />

      <Typography
        sx={{
          fontSize: '14px',
          fontWeight: 600,
          color: timerColor,
          minWidth: '45px',
          textAlign: 'center',
          lineHeight: 1,
          transition: 'color 0.3s ease',
        }}
      >
        {formattedTime}
      </Typography>
    </Box>
  );
};

export default IdleTimer;