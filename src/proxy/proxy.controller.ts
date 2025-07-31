import { Controller, Post, Res, Req } from '@nestjs/common'
import { FastifyReply, FastifyRequest } from 'fastify'
import { OpenAIService } from './openai/openai.service'
import { ProxyService } from './proxy.service'

@Controller('proxy')
export class ProxyController {
  constructor(
    private readonly openAIService: OpenAIService,
    private readonly proxyService: ProxyService,
  ) {}

  @Post('openai/responses')
  async openAIResponses(@Req() req: FastifyRequest, @Res() res: FastifyReply): Promise<void> {
    const upstreamResponse = await this.openAIService.fetchEndpoint('/responses', req.body)
    await this.proxyService.proxyStreamResponse(res, upstreamResponse)
  }
}
