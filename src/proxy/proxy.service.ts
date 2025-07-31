import { Injectable, Logger } from '@nestjs/common'
import { FastifyReply } from 'fastify'

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name)

  async proxyStreamResponse(clientResponse: FastifyReply, upstreamResponse: Response) {
    if (!upstreamResponse.ok || !upstreamResponse.body) {
      const error = await upstreamResponse.text()
      clientResponse.status(upstreamResponse.status).send(error)
      return
    }

    clientResponse.raw.setHeader('Content-Type', 'text/event-stream')
    clientResponse.raw.setHeader('Cache-Control', 'no-cache')
    clientResponse.raw.setHeader('Connection', 'keep-alive')

    const reader = upstreamResponse.body.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        clientResponse.raw.write(chunk)
      }
    } catch (err) {
      this.logger.error('Error reading OpenAI stream', err)
    } finally {
      clientResponse.raw.end()
    }
  }
}
