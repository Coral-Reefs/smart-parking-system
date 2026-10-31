export interface ParkingSpot {
  id: string; // e.g. "A-01"
  zone: 'A' | 'B' | 'C' | 'D';
  zoneName: string; // e.g. "Grand Atrium"
  number: number;
  status: 'available' | 'assigned' | 'occupied';
  occupiedByPlate: string | null;
  carModel?: string;
  distanceMeters: number; // Walking distance to Mall Lobby
  // Coordinates in percentage (0 to 100) on floor map
  x: number;
  y: number;
  width: number;
  height: number;
  orientation: 'horizontal' | 'vertical';
  // Waypoint path sequence from gantry
  path: Array<{ x: number; y: number }>;
}

export interface CustomerRecord {
  plate: string;
  carModel: string;
  carColor: string;
  initialStatus: 'parked' | 'waiting';
  assignedSpotId?: string;
  timestamp: string;
}

export interface SimulationState {
  currentPlate: string;
  currentCarModel: string;
  assignedSpot: ParkingSpot | null;
  drivingStep: 'idle' | 'driving' | 'arrived' | 'parked';
  drivingProgress: number; // 0 to 100%
  statusMessage: string;
  rerouteNotice: string | null;
}
