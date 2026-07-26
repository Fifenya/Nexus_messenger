import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Push notifications via Firebase Cloud Messaging.
 *
 * This is intentionally degrade-gracefully: without a real Firebase project
 * and service account, there is no way to actually deliver a push
 * notification to a device — that's not something that can be faked or
 * worked around. If FIREBASE_SERVICE_ACCOUNT_JSON isn't set, this service
 * logs what it *would* have sent and returns, instead of throwing.
 *
 * To make this real:
 *  1. Create a Firebase project (console.firebase.google.com)
 *  2. Project settings -> Service accounts -> Generate new private key
 *  3. Put the resulting JSON (minified, one line) into the
 *     FIREBASE_SERVICE_ACCOUNT_JSON env var
 *  4. `npm install firebase-admin` (not installed by default here)
 */
@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private messaging: any = null;
  private configured = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const raw = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!raw) {
      this.logger.warn(
        'FIREBASE_SERVICE_ACCOUNT_JSON not set — push notifications are disabled (will log only)',
      );
      return;
    }

    try {
      // Lazy require so the app still boots if firebase-admin isn't installed
      // and push notifications simply aren't configured.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const admin = require('firebase-admin');
      const serviceAccount = JSON.parse(raw);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      this.messaging = admin.messaging();
      this.configured = true;
      this.logger.log('Firebase push notifications configured');
    } catch (err) {
      this.logger.error(
        `Failed to initialize firebase-admin — is it installed and is the JSON valid? ${(err as Error).message}`,
      );
    }
  }

  async sendNewMessage(pushToken: string | null, params: { senderName: string; text: string; chatId: string }) {
    if (!pushToken) return;

    if (!this.configured) {
      this.logger.debug(
        `[push disabled] Would notify token=${pushToken.slice(0, 8)}... : "${params.senderName}: ${params.text}"`,
      );
      return;
    }

    try {
      await this.messaging.send({
        token: pushToken,
        notification: { title: params.senderName, body: params.text },
        data: { chatId: params.chatId },
      });
    } catch (err) {
      this.logger.warn(`Push send failed: ${(err as Error).message}`);
    }
  }
}
