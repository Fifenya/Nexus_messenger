import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { ChatsModule } from '../chats/chats.module';
import { MessagesModule } from '../messages/messages.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ChatsModule,
    MessagesModule,
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  providers: [ChatGateway],
})
export class GatewayModule {}
