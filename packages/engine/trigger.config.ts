import { pythonExtension } from '@trigger.dev/python/extension'
import { defineConfig } from '@trigger.dev/sdk'
import { env } from '@workspace/env'

export default defineConfig({
  project: env.TRIGGER_DEV_PROJECT_ID,
  runtime: 'node',
  logLevel: env.NODE_ENV === 'development' ? 'debug' : 'info',
  maxDuration: 3600,
  retries: {
    enabledInDev: true,
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
        // requirementsFile: 'src/python/requirements.txt',
        devPythonBinaryPath: 'src/python/.venv/bin/python',
        scripts: ['src/python/**/*.py'],
      }),
    ],
  },
})
