import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import fs from 'fs';

import { NODE_ENV } from '$env/static/private';

const config = {
  plugins: [tailwindcss(), sveltekit()],
  server: {
    host: true,
  },
};

if (NODE_ENV === 'development') {
  config.server['https'] = {
    key: fs.readFileSync('localhost-key.pem'),
    cert: fs.readFileSync('localhost.pem'),
  };
}

export default defineConfig(config);
