import { Test, TestingModule } from '@nestjs/testing'
import { Logger } from '@nestjs/common'
import { FastifyReply } from 'fastify'
import { ProxyService } from './proxy.service'
import { MockInstance } from 'vitest'

describe('ProxyService', () => {
  let service: ProxyService
  let loggerSpy: MockInstance

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
      providers: [ProxyService],
    }).compile()

    service = module.get<ProxyService>(ProxyService)

    loggerSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {})

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('proxyStreamResponse', () => {
    it('should proxy successful streaming response', async () => {
      const mockReply = createMockFastifyReply()
      const testData = 'Hello, World!'
      const encoder = new TextEncoder()

      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: encoder.encode(testData) })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      }

      const mockResponse = {
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      } as unknown as Response

      await service.proxyStreamResponse(mockReply as FastifyReply, mockResponse)

      expect(mockReply.raw?.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream')
      expect(mockReply.raw?.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache')
      expect(mockReply.raw?.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive')
      expect(mockReply.raw?.write).toHaveBeenCalledWith(testData)
      expect(mockReply.raw?.end).toHaveBeenCalled()
    })

    it('should handle upstream response errors', async () => {
      const mockReply = createMockFastifyReply()
      const errorMessage = 'Upstream service error'
      const mockResponse = {
        ok: false,
        status: 500,
        text: () => Promise.resolve(errorMessage),
      } as unknown as Response

      await service.proxyStreamResponse(mockReply as FastifyReply, mockResponse)

      expect(mockReply.status).toHaveBeenCalledWith(500)
      expect(mockReply.send).toHaveBeenCalledWith(errorMessage)
      expect(mockReply.raw?.setHeader).not.toHaveBeenCalled()
    })

    it('should handle response without body', async () => {
      const mockReply = createMockFastifyReply()
      const errorMessage = 'No response body'
      const mockResponse = {
        ok: true,
        status: 200,
        body: null,
        text: () => Promise.resolve(errorMessage),
      } as unknown as Response

      await service.proxyStreamResponse(mockReply as FastifyReply, mockResponse)

      expect(mockReply.status).toHaveBeenCalledWith(200)
      expect(mockReply.send).toHaveBeenCalledWith(errorMessage)
      expect(mockReply.raw?.setHeader).not.toHaveBeenCalled()
    })

    it('should handle stream reading errors', async () => {
      const mockReply = createMockFastifyReply()
      const mockReader = {
        read: vi.fn().mockRejectedValue(new Error('Stream read error')),
      }
      const mockResponse = {
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      } as unknown as Response

      await service.proxyStreamResponse(mockReply as FastifyReply, mockResponse)

      expect(loggerSpy).toHaveBeenCalledWith('Error reading OpenAI stream', expect.any(Error))
      expect(mockReply.raw?.end).toHaveBeenCalled()
    })

    it('should handle multiple chunks correctly', async () => {
      const mockReply = createMockFastifyReply()
      const encoder = new TextEncoder()
      const testChunks = ['chunk1', 'chunk2', 'chunk3']
      const encodedChunks = testChunks.map(chunk => encoder.encode(chunk))

      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: encodedChunks[0] })
          .mockResolvedValueOnce({ done: false, value: encodedChunks[1] })
          .mockResolvedValueOnce({ done: false, value: encodedChunks[2] })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      }

      const mockResponse = {
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      } as unknown as Response

      await service.proxyStreamResponse(mockReply as FastifyReply, mockResponse)

      expect(mockReply.raw?.write).toHaveBeenCalledTimes(3)
      expect(mockReply.raw?.write).toHaveBeenNthCalledWith(1, 'chunk1')
      expect(mockReply.raw?.write).toHaveBeenNthCalledWith(2, 'chunk2')
      expect(mockReply.raw?.write).toHaveBeenNthCalledWith(3, 'chunk3')
      expect(mockReply.raw?.end).toHaveBeenCalled()
    })

    it('should properly decode text chunks with streaming option', async () => {
      const mockReply = createMockFastifyReply()
      const encoder = new TextEncoder()
      const testData = 'Test streaming data'

      const mockDecoder = {
        decode: vi.fn().mockReturnValue(testData),
      }
      global.TextDecoder = vi.fn().mockImplementation(() => mockDecoder)

      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: encoder.encode(testData) })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      }

      const mockResponse = {
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      } as unknown as Response

      await service.proxyStreamResponse(mockReply as FastifyReply, mockResponse)

      expect(mockDecoder.decode).toHaveBeenCalledWith(encoder.encode(testData), { stream: true })
      expect(mockReply.raw?.write).toHaveBeenCalledWith(testData)
    })

    it('should ensure response ends even when error occurs during reading', async () => {
      const mockReply = createMockFastifyReply()
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: new Uint8Array([1, 2, 3]) })
          .mockRejectedValueOnce(new Error('Stream error')),
      }
      const mockResponse = {
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      } as unknown as Response

      await service.proxyStreamResponse(mockReply as FastifyReply, mockResponse)

      expect(mockReply.raw?.end).toHaveBeenCalled()
      expect(loggerSpy).toHaveBeenCalled()
    })
  })
})
