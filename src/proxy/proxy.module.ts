import { Module } from '@nestjs/common'
import { ProxyController } from './proxy.controller'
import { ConfigService } from '@nestjs/config'
import { ProxyService } from './proxy.service'
import { OpenAIService } from './openai/openai.service'

@Module({
  controllers: [ProxyController],
  providers: [ConfigService, ProxyService, OpenAIService],
})
export class ProxyModule {}
