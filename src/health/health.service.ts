import { Injectable } from '@nestjs/common'

@Injectable()
export class HealthService {
  private readonly startTime = new Date()

  getStatus(): string {
    return 'ok'
  }

  getHealth() {
    const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000)

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: `${uptime}s`,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    }
  }
}
