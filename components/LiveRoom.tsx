'use client';

import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';

import { ChatPanel } from '@/components/ChatPanel';
import { Controls } from '@/components/Controls';
import type { AuthUser } from '@/lib/types';

interface LiveRoomProps {
  token: string;
  serverUrl: string;
  user: AuthUser;
  roomName: string;
}

export function LiveRoom({ token, serverUrl, user, roomName }: LiveRoomProps) {
  return (
    <LiveKitRoom
      audio={true}
      video={true}
      token={token}
      serverUrl={serverUrl}
      connectOptions={{ autoSubscribe: true }}
      data-lk-theme="default"
    >
      <div className="flex h-[calc(100vh-80px)] w-full gap-4 p-4">
        <div className="flex flex-1 flex-col gap-4 rounded-xl border border-border bg-card p-4">
          <Controls user={user} roomName={roomName} />
          <div className="flex-1 overflow-hidden rounded-xl bg-muted">
            <VideoConference />
          </div>
        </div>
        <ChatPanel user={user} roomName={roomName} />
      </div>
    </LiveKitRoom>
  );
}
