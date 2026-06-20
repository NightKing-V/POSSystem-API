import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    const StatusText = 'POS API Running';
    return StatusText;
  }
}
