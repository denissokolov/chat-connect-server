import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import { ProxyModule } from './proxy/proxy.module'

@Module({
  imports: [ConfigModule.forRoot(), ProxyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
