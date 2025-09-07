import { pythonExtension } from '@trigger.dev/python/extension'
import { defineConfig } from '@trigger.dev/sdk'
import { env } from './src/lib/env'

export default defineConfig({
  project: env.TRIGGER_DEV_PROJECT_ID,
  runtime: 'node',
  logLevel: env.APP_ENV === 'development' ? 'debug' : 'info',
  maxDuration: 3600,
  processKeepAlive: true,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ['./src/trigger'],
  build: {
    extensions: [
      pythonExtension({
        devPythonBinaryPath: './python/.venv/bin/python',
        scripts: ['./python/**/*.py', './python/_legacy/**/*.py'],
      }),
    ],
  },
})
