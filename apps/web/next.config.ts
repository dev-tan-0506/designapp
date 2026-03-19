import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {},
  // Next.js standalone output currently hits EPERM symlink failures on Windows
  // with pnpm workspaces. Keep standalone enabled for Linux/CI/Docker builds.
  output: process.platform === 'win32' ? undefined : 'standalone',
};

export default nextConfig;
