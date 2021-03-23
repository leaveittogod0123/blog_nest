import { Controller, Get } from '@nestjs/common';
import { from, Observable } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): Observable<string> {
    return from(this.appService.getHello()).pipe(delay(6000));
  }
}
