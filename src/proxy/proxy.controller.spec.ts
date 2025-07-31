import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { FastifyRequest, FastifyReply } from 'fastify'

import { ProxyController } from './proxy.controller'
import { ProxyService } from './proxy.service'
import { OpenAIService } from './openai/openai.service'

describe('ProxyController', () => {
  let controller: ProxyController
  let openAIService: OpenAIService
  let proxyService: ProxyService

  const createMockFastifyRequest = (body?: unknown): Partial<FastifyRequest> => ({
    body: body || { model: 'gpt-3.5-turbo', messages: [] },
  })

  const createMockFastifyReply = (): Partial<FastifyReply> => ({
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    raw: {
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
    } as unknown as FastifyReply['raw'],
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProxyController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockReturnValue('sk-test-api-key'),
          },
        },
        {
          provide: OpenAIService,
          useValue: {
            fetchEndpoint: vi.fn(),
          },
        },
        {
          provide: ProxyService,
          useValue: {
            proxyStreamResponse: vi.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<ProxyController>(ProxyController)
    openAIService = module.get<OpenAIService>(OpenAIService)
    proxyService = module.get<ProxyService>(ProxyService)

    vi.clearAllMocks()
  })

  describe('openAIResponses', () => {
    it('should handle successful chat completion request', async () => {
      const mockRequest = createMockFastifyRequest({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
      })
      const mockReply = createMockFastifyReply()
      const mockUpstreamResponse = new Response('{"choices": []}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })

      vi.mocked(openAIService.fetchEndpoint).mockResolvedValue(mockUpstreamResponse)
      vi.mocked(proxyService.proxyStreamResponse).mockResolvedValue(undefined)

      await controller.openAIResponses(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(openAIService.fetchEndpoint).toHaveBeenCalledWith('/responses', mockRequest.body)
      expect(proxyService.proxyStreamResponse).toHaveBeenCalledWith(mockReply, mockUpstreamResponse)
    })

    it('should pass request body to OpenAI service correctly', async () => {
      const requestBody = {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'What is the weather like?' },
        ],
        temperature: 0.7,
        max_tokens: 100,
      }
      const mockRequest = createMockFastifyRequest(requestBody)
      const mockReply = createMockFastifyReply()
      const mockUpstreamResponse = new Response('{}', { status: 200 })

      vi.mocked(openAIService.fetchEndpoint).mockResolvedValue(mockUpstreamResponse)
      vi.mocked(proxyService.proxyStreamResponse).mockResolvedValue(undefined)

      await controller.openAIResponses(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(openAIService.fetchEndpoint).toHaveBeenCalledWith('/responses', requestBody)
    })

    it('should handle OpenAI service errors', async () => {
      const mockRequest = createMockFastifyRequest()
      const mockReply = createMockFastifyReply()
      const serviceError = new Error('OpenAI API error')

      vi.mocked(openAIService.fetchEndpoint).mockRejectedValue(serviceError)

      await expect(
        controller.openAIResponses(mockRequest as FastifyRequest, mockReply as FastifyReply),
      ).rejects.toThrow(serviceError)
      expect(openAIService.fetchEndpoint).toHaveBeenCalledWith('/responses', mockRequest.body)
      expect(proxyService.proxyStreamResponse).not.toHaveBeenCalled()
    })

    it('should handle proxy service errors', async () => {
      const mockRequest = createMockFastifyRequest()
      const mockReply = createMockFastifyReply()
      const mockUpstreamResponse = new Response('{}', { status: 200 })
      const proxyError = new Error('Proxy stream error')

      vi.mocked(openAIService.fetchEndpoint).mockResolvedValue(mockUpstreamResponse)
      vi.mocked(proxyService.proxyStreamResponse).mockRejectedValue(proxyError)

      await expect(
        controller.openAIResponses(mockRequest as FastifyRequest, mockReply as FastifyReply),
      ).rejects.toThrow(proxyError)
      expect(openAIService.fetchEndpoint).toHaveBeenCalledWith('/responses', mockRequest.body)
      expect(proxyService.proxyStreamResponse).toHaveBeenCalledWith(mockReply, mockUpstreamResponse)
    })

    it('should handle requests with empty body', async () => {
      const mockRequest = createMockFastifyRequest()
      const mockReply = createMockFastifyReply()
      const mockUpstreamResponse = new Response('{}', { status: 200 })

      vi.mocked(openAIService.fetchEndpoint).mockResolvedValue(mockUpstreamResponse)
      vi.mocked(proxyService.proxyStreamResponse).mockResolvedValue(undefined)

      await controller.openAIResponses(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(openAIService.fetchEndpoint).toHaveBeenCalledWith('/responses', mockRequest.body)
      expect(proxyService.proxyStreamResponse).toHaveBeenCalledWith(mockReply, mockUpstreamResponse)
    })

    it('should handle requests with complex message structure', async () => {
      const complexRequestBody = {
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'What is in this image?' },
              { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,...' } },
            ],
          },
        ],
        stream: true,
        response_format: { type: 'json_object' },
      }
      const mockRequest = createMockFastifyRequest(complexRequestBody)
      const mockReply = createMockFastifyReply()
      const mockUpstreamResponse = new Response('{}', { status: 200 })

      vi.mocked(openAIService.fetchEndpoint).mockResolvedValue(mockUpstreamResponse)
      vi.mocked(proxyService.proxyStreamResponse).mockResolvedValue(undefined)

      await controller.openAIResponses(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(openAIService.fetchEndpoint).toHaveBeenCalledWith('/responses', complexRequestBody)
      expect(proxyService.proxyStreamResponse).toHaveBeenCalledWith(mockReply, mockUpstreamResponse)
    })
  })
})
