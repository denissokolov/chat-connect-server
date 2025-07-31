import { Controller, Post, Res, HttpException, HttpStatus, Req, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Response as ExpressResponse } from 'express'

@Controller('proxy/openai')
export class OpenAIController {
  private readonly openaiApiUrl = 'https://api.openai.com/v1'
  private readonly logger = new Logger(OpenAIController.name)

  constructor(private readonly configService: ConfigService) {}

  @Post('responses')
  async chatCompletions(@Req() req: Request, @Res() res: ExpressResponse): Promise<void> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY')
    if (!apiKey) {
      throw new HttpException('OpenAI API key is not set', HttpStatus.UNAUTHORIZED)
    }

    const response = await fetch(`${this.openaiApiUrl}/responses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    })

    if (!response.ok || !response.body) {
      const error = await response.text()
      res.status(response.status).send(error)
      return
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        res.write(chunk)
      }
    } catch (err) {
      this.logger.error('Error reading OpenAI stream', err)
    } finally {
      res.end()
    }
  }
}
