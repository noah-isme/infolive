import crypto from 'node:crypto';

export function generateClassCode(length = 6) {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  while (code.length < length) {
    const randomBytes = crypto.randomBytes(length);
    randomBytes.forEach((byte) => {
      if (code.length < length) {
        const index = byte % characters.length;
        code += characters[index];
      }
    });
  }

  return code;
}

export function generateRoomName() {
  const random = crypto.randomUUID().replace(/-/g, '');
  const timestamp = Date.now().toString(36).toUpperCase();
  return `room_${timestamp}_${random.substring(0, 12)}`.toUpperCase();
}
