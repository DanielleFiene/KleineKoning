/**
 * next.config.ts
 * 
 * Next.js configuratie bestand. Definieert build settings, output configuratie,
 * en andere Next.js specifieke instellingen voor Cloudflare Pages deployment.
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Optimize bundle size by excluding unused modules
  experimental: {
    optimizePackageImports: [
      '@mui/material', 
      '@mui/system',
      '@mui/x-date-pickers',
      'lucide-react',
      'date-fns',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-tooltip',
      '@supabase/supabase-js',
    ],
  },
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};

export default nextConfig;

