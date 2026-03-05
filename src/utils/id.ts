// Firebase push key algorithm (https://gist.github.com/mikelehen/3596a30bd69384624c11)
// Generates 20-char keys: 8 timestamp chars + 12 random chars, chronologically sortable.

const PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'

let lastPushTime = 0
const lastRandChars: number[] = []

export function generateId(): string {
  let now = Date.now()
  const duplicateTime = now === lastPushTime
  lastPushTime = now

  const timeStampChars = new Array<string>(8)
  for (let i = 7; i >= 0; i--) {
    timeStampChars[i] = PUSH_CHARS.charAt(now % 64)
    now = Math.floor(now / 64)
  }

  let id = timeStampChars.join('')

  if (!duplicateTime) {
    for (let i = 0; i < 12; i++) {
      lastRandChars[i] = Math.floor(Math.random() * 64)
    }
  } else {
    let i = 11
    for (; i >= 0 && lastRandChars[i] === 63; i--) {
      lastRandChars[i] = 0
    }
    lastRandChars[i]++
  }

  for (let i = 0; i < 12; i++) {
    id += PUSH_CHARS.charAt(lastRandChars[i])
  }

  return id
}

export function isPlaceholderId(id: string): boolean {
  return /^\d+$/.test(id)
}

export function generatePlaceholderId(): string {
  return String(Date.now())
}
