import { Module } from '@nestjs/common';

import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DesignsModule } from './designs/designs.module';
import { ExportModule } from './export/export.module';
import { ImportModule } from './import/import.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [AuthModule, DesignsModule, ImportModule, ExportModule, AdminModule, StorageModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
