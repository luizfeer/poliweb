export function toIsoDateTime(date: string | null): string | null {
  if (!date) {
    return null
  }
  return `${date}T12:00:00.000Z`
}

export function todayDate(): string {
  return new Date().toISOString().slice(0, 10)
}
