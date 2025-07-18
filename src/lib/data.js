// Package up data for sending to server
import { PUBLIC_NODE_ENV } from '$env/static/public';
import posthog from 'posthog-js';

export const sendAccelerationHistory = async (accelerationHistory) => {
  // Don't send in dev
  // if (PUBLIC_NODE_ENV === 'development') return;

  // Don't send null data (e.g. from desktops)
  if (!accelerationHistory || accelerationHistory.length === 0) return;

  const serializedData = JSON.stringify(accelerationHistory, function (key, val) {
    return val?.toFixed ? Number(val.toFixed(3)) : val;
  });
  await fetch('/api/shake-data', {
    method: 'POST',
    body: serializedData,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  posthog.capture('shake-data', serializedData);
};
