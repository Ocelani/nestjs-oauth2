import { Injectable } from '@nestjs/common';
import { User } from '@app/entities';
import { Request } from 'express';
import { RedisStore } from 'connect-redis';
import { SerializedSessionPayload } from '@app/modules/auth/interfaces';
import { Session } from '../types';
import * as UAParser from 'ua-parser-js';

export interface SessionEntry {
  cookie: any;
  passport: { user: SerializedSessionPayload };
  id: string;
}

@Injectable()
export class SessionService {
  async getUserSessions(
    user: User,
    req: Request,
  ): Promise<Session[]> {
    const sessions = await this.getAllSessions(req);

    return sessions.filter(sess => sess.passport?.user?.userId === user.id).map(sess => {
      const parser = new UAParser.UAParser(sess.passport.user.info?.userAgent);

      const browser = parser.getBrowser();
      const os = parser.getOS();

      return {
        sessionId: sess.id,
        ip: sess.passport.user.info?.ip,
        userAgent: parser.getUA(),
        browser: `${browser.name}, v${browser.version}`,
        os: `${os.name} v${os.version}`,
        createdAt: sess.passport.user.info.createdAt ? new Date(sess.passport.user.info.createdAt) : null,
      }
    });
  }

  async getUserSession(
    user: User,
    req: Request,
    sessionId: string,
  ) {
    const userSessions = await this.getUserSessions(user, req);
    const toDelete = userSessions.find(s => s.sessionId === sessionId);

    return toDelete;
  }

  async deleteUserSession(
    user: User,
    req: Request,
    sessionId: string,
  ) {
    const found = await this.getUserSession(user, req, sessionId);
    if (found) {
      return new Promise(resolve => {
        ((req as any).sessionStore as RedisStore).destroy(sessionId, err => {
          if (err) {
            return resolve(false);
          }
          resolve(true);
        });
      })
    }
    return false;
  }

  getAllSessions(req: Request): Promise<SessionEntry[]> {
    return new Promise((resolve, reject) => {
      ((req as any).sessionStore as RedisStore).all((err, obj) => {
        if (err) {
          return reject(err);
        }
        resolve(obj as unknown as SessionEntry[]);
      });
    })
  }
}
