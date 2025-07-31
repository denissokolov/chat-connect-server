import { Test, TestingModule } from '@nestjs/testing'
import { HttpException, HttpStatus } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OpenAIService } from './openai.service'

global.fetch = vi.fn()

describe('OpenAIService', () => {
  let service: OpenAIService
  let configService: ConfigService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAIService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<OpenAIService>(OpenAIService)
    configService = module.get<ConfigService>(ConfigService)

    vi.clearAllMocks()
  })

  describe('fetchEndpoint', () => {
    const mockEndpoint = '/chat/completions'
    const mockBody = { model: 'gpt-3.5-turbo', messages: [] }
    const mockApiKey = 'sk-test-api-key'

    it('should make a successful fetch request with valid API key', async () => {
      const mockResponse = new Response('{"choices": []}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })

      vi.mocked(configService.get).mockReturnValue(mockApiKey)
      vi.mocked(fetch).mockResolvedValue(mockResponse)

      const result = await service.fetchEndpoint(mockEndpoint, mockBody)

      expect(configService.get).toHaveBeenCalledWith('OPENAI_API_KEY')
      expect(fetch).toHaveBeenCalledWith('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockBody),
      })
      expect(result).toBe(mockResponse)
    })

    it('should throw HttpException when API key is not configured', async () => {
      vi.mocked(configService.get).mockReturnValue(undefined)

      try {
        await service.fetchEndpoint(mockEndpoint, mockBody)
        expect.fail('Expected HttpException to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException)
        if (error instanceof HttpException) {
          expect(error.message).toBe('OpenAI API key is not set')
          expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED)
        }
      }

      expect(configService.get).toHaveBeenCalledWith('OPENAI_API_KEY')
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should throw HttpException when API key is empty string', async () => {
      vi.mocked(configService.get).mockReturnValue('')

      try {
        await service.fetchEndpoint(mockEndpoint, mockBody)
        expect.fail('Expected HttpException to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException)
        if (error instanceof HttpException) {
          expect(error.message).toBe('OpenAI API key is not set')
          expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED)
        }
      }

      expect(fetch).not.toHaveBeenCalled()
    })

    it('should handle fetch errors gracefully', async () => {
      const fetchError = new Error('Network error')
      vi.mocked(configService.get).mockReturnValue(mockApiKey)
      vi.mocked(fetch).mockRejectedValue(fetchError)

      await expect(service.fetchEndpoint(mockEndpoint, mockBody)).rejects.toThrow(fetchError)
    })

    it('should construct correct URL with different endpoints', async () => {
      const testEndpoints = ['/models', '/completions', '/embeddings']
      const mockResponse = new Response('{}', { status: 200 })

      vi.mocked(configService.get).mockReturnValue(mockApiKey)
      vi.mocked(fetch).mockResolvedValue(mockResponse)

      for (const endpoint of testEndpoints) {
        await service.fetchEndpoint(endpoint, mockBody)
        expect(fetch).toHaveBeenCalledWith(
          `https://api.openai.com/v1${endpoint}`,
          expect.any(Object),
        )
      }
    })
  })
})
