import { Timestamp } from 'firebase/firestore';
import { TimestampToDatePipe } from './timestamp-to-date.pipe';

describe('TimestampToDatePipe', () => {
  const pipe = new TimestampToDatePipe();
  const date = new Date('2026-03-14T15:09:26.000Z');

  it('formats a Date with the default locale format', () => {
    expect(pipe.transform(date)).toBe(date.toLocaleString());
  });

  it('formats a Firestore Timestamp', () => {
    expect(pipe.transform(Timestamp.fromDate(date), 'iso')).toBe(
      '2026-03-14T15:09:26.000Z',
    );
  });

  it('accepts a plain { seconds, nanoseconds } object', () => {
    const raw = { seconds: date.getTime() / 1000, nanoseconds: 0 };
    expect(pipe.transform(raw as Timestamp, 'iso')).toBe(date.toISOString());
  });

  it('supports the date-only format', () => {
    expect(pipe.transform(date, 'date-only')).toBe(date.toDateString());
  });

  it('falls back to the default format for unknown formats', () => {
    expect(pipe.transform(date, 'nonsense')).toBe(date.toLocaleString());
  });
});
