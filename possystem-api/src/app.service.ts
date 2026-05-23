import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    let StatusText = "POS API Running"
    return StatusText;
  }
}
