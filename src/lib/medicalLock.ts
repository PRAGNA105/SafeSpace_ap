const pinHashKey = (userId: number) => `medical-lock-pin:${userId}`;
const unlockKey = (userId: number) => `medical-lock-open:${userId}`;

async function sha256(value: string) {
  const encoded = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function saveMedicalPin(userId: number, pin: string) {
  const hash = await sha256(pin);
  localStorage.setItem(pinHashKey(userId), hash);
  sessionStorage.setItem(unlockKey(userId), 'open');
}

export function clearMedicalPin(userId: number) {
  localStorage.removeItem(pinHashKey(userId));
  sessionStorage.removeItem(unlockKey(userId));
}

export function hasMedicalPin(userId: number) {
  return Boolean(localStorage.getItem(pinHashKey(userId)));
}

export function isMedicalUnlocked(userId: number) {
  return sessionStorage.getItem(unlockKey(userId)) === 'open';
}

export async function unlockMedicalRecords(userId: number, pin: string) {
  const expectedHash = localStorage.getItem(pinHashKey(userId));
  if (!expectedHash) {
    return false;
  }

  const actualHash = await sha256(pin);
  const valid = actualHash === expectedHash;
  if (valid) {
    sessionStorage.setItem(unlockKey(userId), 'open');
  }

  return valid;
}

export function lockMedicalRecords(userId: number) {
  sessionStorage.removeItem(unlockKey(userId));
}

