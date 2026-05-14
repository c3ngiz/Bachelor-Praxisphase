import { Controller, Get } from '@nestjs/common';

/**
 * Lightweight operational endpoints for local and container health checks.
 */
@Controller()
export class AppController {
  /**
   * Reports process health.
   *
   * @returns Health status payload.
   */
  @Get('health')
  health(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
