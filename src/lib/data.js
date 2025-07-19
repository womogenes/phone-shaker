// Package up data for sending to server
import { PUBLIC_NODE_ENV } from '$env/static/public';
import posthog from 'posthog-js';

export const serialize = (accelerationHistory) => {
  return JSON.stringify(accelerationHistory, function (key, val) {
    return val?.toFixed ? Number(val.toFixed(3)) : val;
  });
};

export const rotateString = (str, shift) => {
  return Array.from(str)
    .map((char) => {
      return String.fromCharCode(char.charCodeAt(0) + shift);
    })
    .join('');
};

export const obfuscate = (obj) => {
  const b64enc = btoa(serialize(obj));
  const rotationAmt = Math.floor(Math.random() * 64 - 32);
  const b64encRotated = rotateString(b64enc, rotationAmt);
  return b64encRotated;
};

export const deobfuscate = (b64encRotated) => {
  for (let rotationAmt = -32; rotationAmt < 32; rotationAmt++) {
    const b64encUnrotated = rotateString(b64encRotated, -rotationAmt);
    try {
      const b64enc = atob(b64encUnrotated);
      return JSON.parse(b64enc);
    } catch {
      //
    }
  }
  return [];
};

export const sendAccelerationHistory = async (accelerationHistory) => {
  // Don't send null data (e.g. from desktops)
  if (!accelerationHistory || accelerationHistory.length === 0) return;

  const payload = obfuscate({
    accelerationHistory,
    posthog_distinct_id: posthog.get_distinct_id(),
  });

  await fetch('/api/shake-data', {
    method: 'POST',
    body: payload,
    headers: {
      'Content-Type': 'text/plain',
    },
  });

  posthog.capture('shake-data', {
    distinct_id: posthog.get_distinct_id(),
    data: serialize(accelerationHistory),
  });
};
