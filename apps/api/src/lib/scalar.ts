export async function fastifyScalar() {
  const { default: fastifyScalar } = await import(
    '@scalar/fastify-api-reference'
  )

  return fastifyScalar
}
