'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import type { AuthUser } from '@/lib/types';

interface ChatPanelProps {
  user: AuthUser;
  roomName: string;
}

export function ChatPanel({ user }: ChatPanelProps) {
  const [message, setMessage] = useState('');

  return (
    <Card className="flex w-80 flex-col border border-border">
      <CardHeader>
        <CardTitle className="text-base">Chat Kelas</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-64 px-4 py-2">
          <p className="text-xs text-muted-foreground">
            Chat realtime akan tampil di sini setelah integrasi data channel selesai.
          </p>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Textarea
          placeholder="Tulis pesan ke peserta..."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          disabled
        />
        <Button className="w-full" disabled>
          Kirim (WIP)
        </Button>
        <p className="text-xs text-muted-foreground">
          Kamu login sebagai <span className="font-semibold text-foreground">{user.name}</span>.
        </p>
      </CardFooter>
    </Card>
  );
}
