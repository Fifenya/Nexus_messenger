import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChatsModule } from './chats/chats.module';
import { MessagesModule } from './messages/messages.module';
import { GatewayModule } from './gateway/gateway.module';
import { UploadsModule } from './uploads/uploads.module';
import { BotsModule } from './bots/bots.module';
import { NexusMotesModule } from './nexus-motes/nexus-motes.module';
import { ThemesModule } from './themes/themes.module';
import { PrivacyModule } from './privacy/privacy.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ChatsModule,
    MessagesModule,
    GatewayModule,
    BotsModule,
    NexusMotesModule,
    ThemesModule,
    PrivacyModule,
    UploadsModule,
  ],
})
export class AppModule {}
