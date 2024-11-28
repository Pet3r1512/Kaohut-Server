import pages from '@hono/vite-cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const commonConfig = {
    build: {
      rollupOptions: {
        external: ['.prisma/client/index-browser'],
      },
    },
  }

  if (mode === 'client') {
    return {
      ...commonConfig,
      build: {
        ...commonConfig.build,
        rollupOptions: {
          ...commonConfig.build.rollupOptions,
          input: './src/client.ts',
          output: {
            entryFileNames: 'static/client.js',
          },
        },
      },
    }
  } else {
    return {
      ...commonConfig,
      plugins: [
        pages(),
        devServer({
          entry: 'src/index.tsx',
        }),
      ],
    }
  }
})
