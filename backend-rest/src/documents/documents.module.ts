import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { WorkspaceModule } from '../workspace/workspace.module.js';
import { DocumentsController } from './documents.controller.js';
import { DocumentsService } from './documents.service.js';

/**
 * Document module for editor content persistence over REST.
 */
@Module({
  controllers: [DocumentsController],
  imports: [AuthModule, WorkspaceModule],
  providers: [DocumentsService],
})
export class DocumentsModule {}
