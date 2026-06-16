import { Global, Module } from '@nestjs/common';
import { AppConfig, APP_CONFIG, loadConfig } from './app-config';

@Global()
@Module({
  providers: [
    { provide: APP_CONFIG, useFactory: () => loadConfig() },
    { provide: AppConfig, useExisting: APP_CONFIG },
  ],
  exports: [APP_CONFIG, AppConfig],
})
export class AppConfigModule {}
