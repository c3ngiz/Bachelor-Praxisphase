import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { WorkspaceController } from './workspace.controller.js';
import { WorkspaceService } from './workspace.service.js';

/**
 * Workspace module containing explorer, hierarchy, move, and sharing behavior.
 */
@Module({
  controllers: [WorkspaceController],
  exports: [WorkspaceService],
  imports: [AuthModule, UsersModule],
  providers: [WorkspaceService],
})
export class WorkspaceModule {}
