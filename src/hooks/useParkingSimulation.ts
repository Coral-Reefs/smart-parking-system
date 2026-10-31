import { useCallback, useEffect, useReducer } from 'react';
import { CustomerRecord, ParkingSpot } from '../types';
import { INITIAL_PARKING_SPOTS, SAMPLE_CUSTOMERS } from '../data/sampleRecords';

export const DRIVING_TICK_MS = 80;
export const DRIVING_PROGRESS_STEP = 2.5;
export const INITIAL_PLATE = 'LBN 6203';
export const INITIAL_CAR_MODEL = 'Nissan X-Trail (Emerald Green)';

export type AllocationReason = 'assigned' | 'preferred-unavailable' | 'full';

export interface AllocationOptions {
  /** Bay the shopper asked for (for example by tapping the floor map). */
  preferredSpotId?: string;
  /** Bay reserved by the previous shopper, released before the new allocation. */
  previousAssignedSpotId?: string | null;
  /** Parked vehicles stay occupied; only provisional "assigned" bays are released. */
  keepPreviousAssignment?: boolean;
}

export interface AllocationResult {
  spots: ParkingSpot[];
  assignedSpot: ParkingSpot | null;
  notice: string | null;
  reason: AllocationReason;
}

export interface RerouteResult {
  spots: ParkingSpot[];
  assignedSpot: ParkingSpot | null;
  notice: string;
}

function releaseProvisionalAssignment(
  spots: ParkingSpot[],
  spotId: string | null | undefined
): ParkingSpot[] {
  if (!spotId) return spots;

  return spots.map((spot) =>
    spot.id === spotId && spot.status === 'assigned'
      ? { ...spot, status: 'available' as const }
      : spot
  );
}

function findNearestAvailableSpot(spots: ParkingSpot[]): ParkingSpot | null {
  let nearest: ParkingSpot | null = null;

  for (const spot of spots) {
    if (spot.status !== 'available') continue;
    if (!nearest || spot.distanceMeters < nearest.distanceMeters) {
      nearest = spot;
    }
  }

  return nearest;
}

function markAssigned(spots: ParkingSpot[], spotId: string): ParkingSpot[] {
  return spots.map((spot) =>
    spot.id === spotId ? { ...spot, status: 'assigned' as const } : spot
  );
}

/**
 * Allocate the nearest free bay, honouring a preferred bay when it is free.
 * If the preferred bay was taken in the meantime, the next free alternative is
 * suggested and a human-readable notice is returned.
 */
export function allocateParkingSpot(
  spots: ParkingSpot[],
  options: AllocationOptions = {}
): AllocationResult {
  const availableSpots = options.keepPreviousAssignment
    ? spots
    : releaseProvisionalAssignment(spots, options.previousAssignedSpotId);

  const nearest = findNearestAvailableSpot(availableSpots);

  if (!nearest) {
    return {
      spots: availableSpots,
      assignedSpot: null,
      notice: 'Level B1 is full. Suggesting closest parking zone on Level B2.',
      reason: 'full',
    };
  }

  if (options.preferredSpotId) {
    const preferred = availableSpots.find(
      (spot) => spot.id === options.preferredSpotId
    );

    if (!preferred || preferred.status !== 'available') {
      return {
        spots: markAssigned(availableSpots, nearest.id),
        assignedSpot: { ...nearest, status: 'assigned' },
        notice: `Requested Bay ${options.preferredSpotId} is already taken. Suggested closest free alternative: Bay ${nearest.id} (${nearest.distanceMeters}m to Lifts).`,
        reason: 'preferred-unavailable',
      };
    }

    return {
      spots: markAssigned(availableSpots, preferred.id),
      assignedSpot: { ...preferred, status: 'assigned' },
      notice: null,
      reason: 'assigned',
    };
  }

  return {
    spots: markAssigned(availableSpots, nearest.id),
    assignedSpot: { ...nearest, status: 'assigned' },
    notice: null,
    reason: 'assigned',
  };
}

/**
 * Simulate a rival vehicle taking the currently assigned bay, then reroute the
 * shopper to the nearest remaining free bay. The rival plate is passed in so the
 * algorithm stays deterministic and testable.
 */
export function rerouteAfterContention(
  spots: ParkingSpot[],
  assignedSpotId: string,
  rivalPlate: string
): RerouteResult {
  const spotsWithRival = spots.map((spot) =>
    spot.id === assignedSpotId
      ? {
          ...spot,
          status: 'occupied' as const,
          occupiedByPlate: rivalPlate,
          carModel: 'Walk-in Shopper',
        }
      : spot
  );

  const nextFree = findNearestAvailableSpot(spotsWithRival);

  if (!nextFree) {
    return {
      spots: spotsWithRival,
      assignedSpot: null,
      notice: `Bay ${assignedSpotId} was taken and Level B1 is now completely full.`,
    };
  }

  return {
    spots: markAssigned(spotsWithRival, nextFree.id),
    assignedSpot: { ...nextFree, status: 'assigned' },
    notice: `Bay ${assignedSpotId} was just taken by ${rivalPlate}. Smart light strips dynamically rerouted to next free spot: Bay ${nextFree.id} (${nextFree.distanceMeters}m to Lifts)!`,
  };
}

interface SimulationState {
  spots: ParkingSpot[];
  customers: CustomerRecord[];
  currentPlate: string;
  currentCarModel: string;
  assignedSpotId: string | null;
  drivingProgress: number;
  isDriving: boolean;
  isParked: boolean;
  rerouteNotice: string | null;
}

type SimulationAction =
  | { type: 'SET_PLATE'; plate: string }
  | { type: 'SET_CAR_MODEL'; model: string }
  | { type: 'ASSIGN'; preferredSpotId?: string }
  | { type: 'SIMULATE_CONTENTION'; rivalPlate: string }
  | { type: 'START_DRIVE' }
  | { type: 'PAUSE_DRIVE' }
  | { type: 'TICK' }
  | { type: 'COMPLETE_PARK' }
  | { type: 'RELEASE_SPOT'; spotId: string }
  | { type: 'NEXT_CUSTOMER'; customer: CustomerRecord }
  | { type: 'SELECT_CUSTOMER'; customer: CustomerRecord };

function createInitialState(): SimulationState {
  const allocation = allocateParkingSpot(INITIAL_PARKING_SPOTS);

  return {
    spots: allocation.spots,
    customers: SAMPLE_CUSTOMERS,
    currentPlate: INITIAL_PLATE,
    currentCarModel: INITIAL_CAR_MODEL,
    assignedSpotId: allocation.assignedSpot?.id ?? null,
    drivingProgress: 0,
    isDriving: false,
    isParked: false,
    rerouteNotice: allocation.notice,
  };
}

function parkAssignedSpot(state: SimulationState): SimulationState {
  if (!state.assignedSpotId || state.isParked) return state;

  const assignedSpotId = state.assignedSpotId;

  return {
    ...state,
    spots: state.spots.map((spot) =>
      spot.id === assignedSpotId
        ? {
            ...spot,
            status: 'occupied',
            occupiedByPlate: state.currentPlate,
            carModel: state.currentCarModel,
          }
        : spot
    ),
    customers: state.customers.map((customer) =>
      customer.plate === state.currentPlate
        ? {
            ...customer,
            initialStatus: 'parked',
            assignedSpotId,
          }
        : customer
    ),
    drivingProgress: 100,
    isDriving: false,
    isParked: true,
  };
}

function reduceAssign(
  state: SimulationState,
  preferredSpotId?: string
): SimulationState {
  const allocation = allocateParkingSpot(state.spots, {
    preferredSpotId,
    previousAssignedSpotId: state.assignedSpotId,
    keepPreviousAssignment: state.isParked,
  });

  return {
    ...state,
    spots: allocation.spots,
    assignedSpotId: allocation.assignedSpot?.id ?? null,
    drivingProgress: 0,
    isDriving: false,
    isParked: false,
    rerouteNotice: allocation.notice,
  };
}

function reduceNextCustomer(
  state: SimulationState,
  customer: CustomerRecord
): SimulationState {
  const allocation = allocateParkingSpot(state.spots, {
    previousAssignedSpotId: state.assignedSpotId,
    keepPreviousAssignment: state.isParked,
  });

  return {
    ...state,
    customers: state.customers,
    currentPlate: customer.plate,
    currentCarModel: customer.carModel,
    spots: allocation.spots,
    assignedSpotId: allocation.assignedSpot?.id ?? null,
    drivingProgress: 0,
    isDriving: false,
    isParked: false,
    rerouteNotice: allocation.notice,
  };
}

function reduceSelectCustomer(
  state: SimulationState,
  customer: CustomerRecord
): SimulationState {
  const existingSpot = state.spots.find(
    (spot) => spot.occupiedByPlate === customer.plate
  );

  if (existingSpot) {
    const spots = state.isParked
      ? state.spots
      : releaseProvisionalAssignment(state.spots, state.assignedSpotId);

    return {
      ...state,
      spots,
      currentPlate: customer.plate,
      currentCarModel: customer.carModel,
      assignedSpotId: existingSpot.id,
      drivingProgress: 100,
      isDriving: false,
      isParked: true,
      rerouteNotice: `Vehicle ${customer.plate} is already parked in Bay ${existingSpot.id}.`,
    };
  }

  const allocation = allocateParkingSpot(state.spots, {
    previousAssignedSpotId: state.assignedSpotId,
    keepPreviousAssignment: state.isParked,
  });

  return {
    ...state,
    spots: allocation.spots,
    currentPlate: customer.plate,
    currentCarModel: customer.carModel,
    assignedSpotId: allocation.assignedSpot?.id ?? null,
    drivingProgress: 0,
    isDriving: false,
    isParked: false,
    rerouteNotice: allocation.notice,
  };
}

function simulationReducer(
  state: SimulationState,
  action: SimulationAction
): SimulationState {
  switch (action.type) {
    case 'SET_PLATE':
      return { ...state, currentPlate: action.plate };

    case 'SET_CAR_MODEL':
      return { ...state, currentCarModel: action.model };

    case 'ASSIGN':
      return reduceAssign(state, action.preferredSpotId);

    case 'SIMULATE_CONTENTION': {
      if (!state.assignedSpotId || state.isParked) return state;

      const reroute = rerouteAfterContention(
        state.spots,
        state.assignedSpotId,
        action.rivalPlate
      );

      return {
        ...state,
        spots: reroute.spots,
        assignedSpotId: reroute.assignedSpot?.id ?? null,
        drivingProgress: 0,
        isDriving: false,
        rerouteNotice: reroute.notice,
      };
    }

    case 'START_DRIVE':
      if (!state.assignedSpotId || state.isParked) return state;
      return { ...state, isDriving: true };

    case 'PAUSE_DRIVE':
      return { ...state, isDriving: false };

    case 'TICK': {
      if (!state.isDriving) return state;

      const nextProgress = Math.min(
        100,
        state.drivingProgress + DRIVING_PROGRESS_STEP
      );

      if (nextProgress >= 100) {
        return parkAssignedSpot({ ...state, drivingProgress: 100 });
      }

      return { ...state, drivingProgress: nextProgress };
    }

    case 'COMPLETE_PARK':
      return parkAssignedSpot(state);

    case 'RELEASE_SPOT': {
      const spots = state.spots.map((spot) =>
        spot.id === action.spotId
          ? {
              ...spot,
              status: 'available' as const,
              occupiedByPlate: null,
              carModel: undefined,
            }
          : spot
      );

      if (state.assignedSpotId !== action.spotId) {
        return { ...state, spots };
      }

      return {
        ...state,
        spots,
        assignedSpotId: null,
        drivingProgress: 0,
        isDriving: false,
        isParked: false,
      };
    }

    case 'NEXT_CUSTOMER':
      return reduceNextCustomer(state, action.customer);

    case 'SELECT_CUSTOMER':
      return reduceSelectCustomer(state, action.customer);

    default:
      return state;
  }
}

function pickNextCustomer(
  customers: CustomerRecord[],
  currentPlate: string
): CustomerRecord {
  const waiting = customers.find(
    (customer) =>
      customer.initialStatus === 'waiting' && customer.plate !== currentPlate
  );

  if (waiting) return waiting;

  return {
    plate: `K${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)}`,
    carModel: 'Shopper Vehicle',
    carColor: '#38bdf8',
    initialStatus: 'waiting',
    timestamp: 'Just now',
  };
}

export function useParkingSimulation() {
  const [state, dispatch] = useReducer(simulationReducer, undefined, createInitialState);

  useEffect(() => {
    if (!state.isDriving) return;

    const intervalId = window.setInterval(() => {
      dispatch({ type: 'TICK' });
    }, DRIVING_TICK_MS);

    return () => window.clearInterval(intervalId);
  }, [state.isDriving]);

  const setCurrentPlate = useCallback((plate: string) => {
    dispatch({ type: 'SET_PLATE', plate });
  }, []);

  const setCurrentCarModel = useCallback((model: string) => {
    dispatch({ type: 'SET_CAR_MODEL', model });
  }, []);

  const assignSpot = useCallback((preferredSpotId?: string) => {
    dispatch({ type: 'ASSIGN', preferredSpotId });
  }, []);

  const simulateContention = useCallback(() => {
    dispatch({
      type: 'SIMULATE_CONTENTION',
      rivalPlate: `RIV ${Math.floor(1000 + Math.random() * 9000)}`,
    });
  }, []);

  const startDrive = useCallback(() => {
    dispatch({ type: 'START_DRIVE' });
  }, []);

  const pauseDrive = useCallback(() => {
    dispatch({ type: 'PAUSE_DRIVE' });
  }, []);

  const completePark = useCallback(() => {
    dispatch({ type: 'COMPLETE_PARK' });
  }, []);

  const releaseSpot = useCallback((spotId: string) => {
    dispatch({ type: 'RELEASE_SPOT', spotId });
  }, []);

  const resetForNextCar = useCallback(() => {
    dispatch({
      type: 'NEXT_CUSTOMER',
      customer: pickNextCustomer(state.customers, state.currentPlate),
    });
  }, [state.customers, state.currentPlate]);

  const selectCustomer = useCallback((customer: CustomerRecord) => {
    dispatch({ type: 'SELECT_CUSTOMER', customer });
  }, []);

  const assignedSpot = state.assignedSpotId
    ? state.spots.find((spot) => spot.id === state.assignedSpotId) ?? null
    : null;

  const availableCount = state.spots.filter(
    (spot) => spot.status === 'available'
  ).length;

  return {
    spots: state.spots,
    customers: state.customers,
    currentPlate: state.currentPlate,
    currentCarModel: state.currentCarModel,
    assignedSpot,
    drivingProgress: state.drivingProgress,
    isDriving: state.isDriving,
    isParked: state.isParked,
    rerouteNotice: state.rerouteNotice,
    availableCount,
    totalCount: state.spots.length,
    setCurrentPlate,
    setCurrentCarModel,
    assignSpot,
    simulateContention,
    startDrive,
    pauseDrive,
    completePark,
    releaseSpot,
    resetForNextCar,
    selectCustomer,
  };
}
