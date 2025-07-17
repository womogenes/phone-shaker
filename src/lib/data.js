// Package up data for sending to server

export const sendAccelerationHistory = async (accelerationHistory) => {
  await fetch('/api/shake-data', {
    method: 'POST',
    body: JSON.stringify(accelerationHistory, function (key, val) {
      return val?.toFixed ? Number(val.toFixed(3)) : val;
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
