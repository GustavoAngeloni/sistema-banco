import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { UserService } from './user/user.service';
import { AccountService } from './account/account.service';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [ConfigModule.forRoot(), ServeStaticModule.forRoot({
    rootPath: join(process.cwd(), 'public'),
  })],
  controllers: [AppController],
  providers: [AppService, PrismaService, UserService, AccountService],
})
export class AppModule {}
