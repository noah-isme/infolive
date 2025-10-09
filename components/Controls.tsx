'use client';

import { Mic, Video, MonitorUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { AuthUser } from '@/lib/types';

interface ControlsProps {
  user: AuthUser;
  roomName: string;
}

export function Controls({ user }: ControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/40 p-3">
      <div>
        <p className="text-sm font-medium text-foreground">Terhubung sebagai {user.name}</p>
        <p className="text-xs uppercase text-muted-foreground">{user.role}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Mic className="mr-2 size-4" /> Mic
        </Button>
        <Button variant="outline" size="sm">
          <Video className="mr-2 size-4" /> Kamera
        </Button>
        <Button variant="outline" size="sm">
          <MonitorUp className="mr-2 size-4" /> Screen
        </Button>
      </div>
    </div>
  );
}
