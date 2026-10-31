import { describe, expect, it } from 'vitest';
import type { ParkingSpot } from '../types';
import {
  allocateParkingSpot,
  rerouteAfterContention,
} from './useParkingSimulation';

function makeSpot(
  id: string,
  distanceMeters: number,
  status: ParkingSpot['status'] = 'available',
  overrides: Partial<ParkingSpot> = {}
): ParkingSpot {
  return {
    id,
    zone: id.charAt(0) as ParkingSpot['zone'],
    zoneName: `Zone ${id.charAt(0)}`,
    number: Number(id.split('-')[1]),
    status,
    occupiedByPlate: status === 'occupied' ? `OLD ${id}` : null,
    distanceMeters,
    x: 0,
    y: 0,
    width: 60,
    height: 90,
    orientation: 'horizontal',
    path: [
      { x: 0, y: 0 },
      { x: 0, y: 10 },
    ],
    ...overrides,
  };
}

function statusOf(spots: ParkingSpot[], id: string): ParkingSpot['status'] {
  const spot = spots.find((candidate) => candidate.id === id);
  if (!spot) throw new Error(`Missing test spot ${id}`);
  return spot.status;
}

describe('allocateParkingSpot', () => {
  it('assigns the nearest available bay when no preference is given', () => {
    const spots = [
      makeSpot('A-01', 30),
      makeSpot('B-01', 12),
      makeSpot('C-01', 20),
    ];

    const result = allocateParkingSpot(spots);

    expect(result.assignedSpot?.id).toBe('B-01');
    expect(result.reason).toBe('assigned');
    expect(result.notice).toBeNull();
    expect(statusOf(result.spots, 'B-01')).toBe('assigned');
    expect(statusOf(result.spots, 'A-01')).toBe('available');
    expect(statusOf(result.spots, 'C-01')).toBe('available');
  });

  it('honours a preferred bay that is still available', () => {
    const spots = [
      makeSpot('A-01', 30),
      makeSpot('B-01', 12),
    ];

    const result = allocateParkingSpot(spots, { preferredSpotId: 'A-01' });

    expect(result.assignedSpot?.id).toBe('A-01');
    expect(result.assignedSpot?.status).toBe('assigned');
    expect(result.reason).toBe('assigned');
    expect(result.notice).toBeNull();
    expect(statusOf(result.spots, 'B-01')).toBe('available');
  });

  it('falls back to the nearest free bay when the preferred bay is occupied', () => {
    const spots = [
      makeSpot('A-01', 30),
      makeSpot('A-02', 5, 'occupied'),
      makeSpot('B-02', 12),
    ];

    const result = allocateParkingSpot(spots, { preferredSpotId: 'A-02' });

    expect(result.assignedSpot?.id).toBe('B-02');
    expect(result.reason).toBe('preferred-unavailable');
    expect(result.notice).toContain('Requested Bay A-02 is already taken');
    expect(result.notice).toContain('Bay B-02');
    expect(statusOf(result.spots, 'A-02')).toBe('occupied');
  });

  it('falls back when the preferred bay does not exist', () => {
    const spots = [makeSpot('A-01', 30), makeSpot('B-01', 12)];

    const result = allocateParkingSpot(spots, { preferredSpotId: 'Z-99' });

    expect(result.assignedSpot?.id).toBe('B-01');
    expect(result.reason).toBe('preferred-unavailable');
    expect(result.notice).toContain('Requested Bay Z-99 is already taken');
  });

  it('releases the previous provisional assignment before allocating again', () => {
    const spots = [
      makeSpot('A-01', 30, 'assigned'),
      makeSpot('B-01', 12),
    ];

    const result = allocateParkingSpot(spots, {
      previousAssignedSpotId: 'A-01',
    });

    expect(result.assignedSpot?.id).toBe('B-01');
    expect(statusOf(result.spots, 'A-01')).toBe('available');
    expect(statusOf(result.spots, 'B-01')).toBe('assigned');
    expect(
      result.spots.filter((spot) => spot.status === 'assigned')
    ).toHaveLength(1);
  });

  it('can reallocate to the previously assigned bay after releasing it', () => {
    const spots = [makeSpot('A-01', 10, 'assigned')];

    const result = allocateParkingSpot(spots, {
      previousAssignedSpotId: 'A-01',
      preferredSpotId: 'A-01',
    });

    expect(result.assignedSpot?.id).toBe('A-01');
    expect(result.notice).toBeNull();
  });

  it('keeps an occupied previous bay untouched when the vehicle is parked', () => {
    const spots = [
      makeSpot('A-01', 20, 'occupied', { occupiedByPlate: 'CURRENT' }),
      makeSpot('B-01', 12),
    ];

    const result = allocateParkingSpot(spots, {
      previousAssignedSpotId: 'A-01',
      keepPreviousAssignment: true,
    });

    expect(result.assignedSpot?.id).toBe('B-01');
    expect(statusOf(result.spots, 'A-01')).toBe('occupied');
  });

  it('returns no assignment and a full notice when every bay is taken', () => {
    const spots = [
      makeSpot('A-01', 30, 'occupied'),
      makeSpot('B-01', 12, 'occupied'),
    ];

    const result = allocateParkingSpot(spots);

    expect(result.assignedSpot).toBeNull();
    expect(result.reason).toBe('full');
    expect(result.notice).toContain('Level B1 is full');
    expect(result.spots).toEqual(spots);
  });

  it('keeps the first bay when distances are tied', () => {
    const spots = [makeSpot('A-01', 12), makeSpot('B-01', 12)];

    const result = allocateParkingSpot(spots);

    expect(result.assignedSpot?.id).toBe('A-01');
  });

  it('does not mutate the input spots', () => {
    const spots = [
      makeSpot('A-01', 30),
      makeSpot('B-01', 12),
    ];

    allocateParkingSpot(spots, { preferredSpotId: 'A-01' });

    expect(statusOf(spots, 'A-01')).toBe('available');
    expect(statusOf(spots, 'B-01')).toBe('available');
  });
});

describe('rerouteAfterContention', () => {
  it('marks the assigned bay as occupied and reroutes to the next nearest free bay', () => {
    const spots = [
      makeSpot('A-01', 10, 'assigned'),
      makeSpot('B-01', 12),
      makeSpot('C-01', 20),
    ];

    const result = rerouteAfterContention(spots, 'A-01', 'RIV 1234');

    expect(result.assignedSpot?.id).toBe('B-01');
    expect(result.spots.find((spot) => spot.id === 'A-01')).toMatchObject({
      status: 'occupied',
      occupiedByPlate: 'RIV 1234',
    });
    expect(statusOf(result.spots, 'B-01')).toBe('assigned');
    expect(statusOf(result.spots, 'C-01')).toBe('available');
    expect(result.notice).toContain('Bay A-01 was just taken by RIV 1234');
    expect(result.notice).toContain('Bay B-01');
  });

  it('skips occupied bays and picks the nearest remaining free bay', () => {
    const spots = [
      makeSpot('A-01', 15, 'assigned'),
      makeSpot('A-02', 5, 'occupied'),
      makeSpot('B-01', 12),
      makeSpot('C-01', 20),
    ];

    const result = rerouteAfterContention(spots, 'A-01', 'RIV 5678');

    expect(result.assignedSpot?.id).toBe('B-01');
  });

  it('returns no assignment when contention leaves the floor full', () => {
    const spots = [
      makeSpot('A-01', 15, 'assigned'),
      makeSpot('B-01', 12, 'occupied'),
    ];

    const result = rerouteAfterContention(spots, 'A-01', 'RIV 9999');

    expect(result.assignedSpot).toBeNull();
    expect(result.notice).toBe(
      'Bay A-01 was taken and Level B1 is now completely full.'
    );
    expect(statusOf(result.spots, 'A-01')).toBe('occupied');
    expect(statusOf(result.spots, 'B-01')).toBe('occupied');
  });

  it('does not mutate the input spots', () => {
    const spots = [
      makeSpot('A-01', 10, 'assigned'),
      makeSpot('B-01', 12),
    ];

    rerouteAfterContention(spots, 'A-01', 'RIV 0001');

    expect(statusOf(spots, 'A-01')).toBe('assigned');
    expect(statusOf(spots, 'B-01')).toBe('available');
  });
});
