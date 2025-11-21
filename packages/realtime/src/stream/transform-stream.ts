export class JsonLinesTransformStream<O = any> extends TransformStream<
  string,
  O
> {
  constructor() {
    super({
      transform(chunk, controller) {
        const lines = chunk.split('\n\n').filter(Boolean)

        for (const line of lines) {
          controller.enqueue(JSON.parse(line) as O)
        }
      },
    })
  }
}
