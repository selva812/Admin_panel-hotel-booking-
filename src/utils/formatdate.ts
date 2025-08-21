import { DateTime } from 'luxon'

export function parseISTDate(dateString: string): Date {
  const customFormat = "yyyyMMdd'T'HH:mm:ss.SSS"

  const dt = DateTime.fromFormat(dateString, customFormat, {
    zone: 'Asia/Kolkata'
  })

  if (!dt.isValid) throw new Error('Invalid custom format')

  return dt.toUTC().toJSDate() // This gives correct UTC for originally IST time
}
