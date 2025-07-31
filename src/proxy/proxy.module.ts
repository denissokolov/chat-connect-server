import { Module } from '@nestjs/common'
import { OpenAIController } from './open-ai/openai.controller'
import { ConfigService } from '@nestjs/config'

@Module({
  controllers: [OpenAIController],
  providers: [ConfigService],
})
export class ProxyModule {}
