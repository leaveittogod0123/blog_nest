import { Module } from '@nestjs/common';
import { TimeoutInterceptor } from 'src/filters/timeout/interceptor.interceptor';
import { LoggingInterceptor } from './logging/logging.interceptor';

@Module({
  providers: [TimeoutInterceptor, LoggingInterceptor],
})
export class CoreModule {}
