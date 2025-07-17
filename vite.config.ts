import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import fs from 'fs';

const config = {
  plugins: [tailwindcss(), sveltekit()],
  server: {
    host: true,
  },
};

if (process.env.NODE_ENV === 'development') {
  config.server['https'] = {
    key: fs.readFileSync('localhost-key.pem'),
    cert: fs.readFileSync('localhost.pem'),
  };
}

export default defineConfig(config);
