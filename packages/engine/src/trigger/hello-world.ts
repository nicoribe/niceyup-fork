import { task } from '@trigger.dev/sdk'
import { python } from '../python'

export const helloWorld = task({
  id: 'hello-world',
  run: async () => {
    const result = await python.main({ name: 'Davy Jones' })

    console.log(result)

    return {
      status: 'success',
      message: 'Job completed!',
    }
  },
})
