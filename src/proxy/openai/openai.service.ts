import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class OpenAIService {
  private readonly API_URL = 'https://api.openai.com/v1'

  constructor(private readonly configService: ConfigService) {}

  fetchEndpoint(endpoint: string, body: unknown): Promise<Response> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY')
    if (!apiKey) {
      throw new HttpException('OpenAI API key is not set', HttpStatus.UNAUTHORIZED)
    }

    return fetch(`${this.API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }
}
