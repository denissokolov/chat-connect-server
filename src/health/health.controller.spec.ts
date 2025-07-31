import { Test, TestingModule } from '@nestjs/testing'
import { HealthController } from './health.controller'
import { HealthService } from './health.service'

describe('HealthController', () => {
  let healthController: HealthController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile()

    healthController = app.get<HealthController>(HealthController)
  })

  describe('root', () => {
    it('should return "ok"', () => {
      expect(healthController.getStatus()).toBe('ok')
    })
  })

  describe('health', () => {
    it('should return health status', () => {
      const health = healthController.getHealth()

      expect(health).toHaveProperty('status', 'ok')
      expect(health).toHaveProperty('timestamp')
      expect(health).toHaveProperty('uptime')
      expect(health).toHaveProperty('version')
      expect(health).toHaveProperty('environment')
      expect(typeof health.timestamp).toBe('string')
      expect(typeof health.uptime).toBe('string')
    })
  })
})
