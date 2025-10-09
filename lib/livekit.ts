import { Role } from '@prisma/client';
import { AccessToken, TrackSource } from 'livekit-server-sdk';

import { getEnv } from '@/lib/env';

interface LiveKitTokenParams {
  identity: string;
  room: string;
  name?: string;
  role: Role;
}

const env = getEnv();

export async function createLiveKitToken({ identity, room, name, role }: LiveKitTokenParams) {
  const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
    identity,
    name,
    metadata: JSON.stringify({ role }),
  });

  token.addGrant({
    room,
    roomJoin: true,
    roomCreate: role === Role.TEACHER,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
    canPublishSources:
      role === Role.TEACHER
        ? [
            TrackSource.CAMERA,
            TrackSource.MICROPHONE,
            TrackSource.SCREEN_SHARE,
            TrackSource.SCREEN_SHARE_AUDIO,
          ]
        : [TrackSource.CAMERA, TrackSource.MICROPHONE],
  });

  return token.toJwt();
}
