import { getLocalDate, formatDuration, formatDurationHours } from '../lib/utils/timezone'

describe('Timezone utilities', () => {
  describe('getLocalDate', () => {
    it('should convert UTC date to local date string', () => {
      const utcDate = new Date('2024-01-15T12:00:00Z')
      const localDate = getLocalDate(utcDate, 'America/New_York')
      expect(localDate).toBe('2024-01-15')
    })

    it('should handle timezone correctly', () => {
      const utcDate = new Date('2024-01-15T23:00:00Z')
      const localDate = getLocalDate(utcDate, 'America/New_York')
      // Should be Jan 15 in EST (UTC-5)
      expect(localDate).toBe('2024-01-15')
    })
  })

  describe('formatDuration', () => {
    it('should format seconds to HH:MM:SS', () => {
      expect(formatDuration(3661)).toBe('1:01:01')
      expect(formatDuration(3600)).toBe('1:00:00')
      expect(formatDuration(3665)).toBe('1:01:05')
    })

    it('should format seconds to MM:SS for durations less than an hour', () => {
      expect(formatDuration(65)).toBe('1:05')
      expect(formatDuration(125)).toBe('2:05')
      expect(formatDuration(3599)).toBe('59:59')
    })

    it('should handle zero seconds', () => {
      expect(formatDuration(0)).toBe('0:00')
    })
  })

  describe('formatDurationHours', () => {
    it('should format seconds to hours and minutes', () => {
      expect(formatDurationHours(3661)).toBe('1h 1m')
      expect(formatDurationHours(3600)).toBe('1h 0m')
      expect(formatDurationHours(125)).toBe('0h 2m')
    })

    it('should handle zero seconds', () => {
      expect(formatDurationHours(0)).toBe('0h 0m')
    })
  })
})

