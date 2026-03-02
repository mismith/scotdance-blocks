export function generateId(): string {
  return crypto.randomUUID()
}

export function isPlaceholderId(id: string): boolean {
  return /^\d+$/.test(id)
}

export function generatePlaceholderId(): string {
  return String(Date.now())
}
