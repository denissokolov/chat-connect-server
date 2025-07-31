import { Test, TestingModule } from '@nestjs/testing'
import { OpenAIController } from './openai.controller'
import { ConfigService } from '@nestjs/config'

describe('OpenAIController', () => {
  let controller: OpenAIController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OpenAIController],
      providers: [ConfigService],
    }).compile()

    controller = module.get<OpenAIController>(OpenAIController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
