import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
    resolveAlias: {
      fs: { browser: './lib/empty.ts' },
    },
  },
}

export default nextConfig
