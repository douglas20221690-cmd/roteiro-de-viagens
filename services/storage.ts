import { Trip, User, ActivityType } from '../types';

// This service mocks a Firebase database using LocalStorage
// so the user can test the app immediately without API keys.

const STORAGE_KEY_TRIPS = 'viajero_trips';
const STORAGE_KEY_USER = 'viajero_user';

export const mockLogin = async (): Promise<User> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const mockUser: User = {
    uid: 'user_12345',
    displayName: 'Viajante',
    email: 'viajante@exemplo.com',
    photoURL: 'https://picsum.photos/100/100'
  };
  
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(mockUser));
  return mockUser;
};

export const logout = async (): Promise<void> => {
  localStorage.removeItem(STORAGE_KEY_USER);
};

export const getUser = (): User | null => {
  const data = localStorage.getItem(STORAGE_KEY_USER);
  return data ? JSON.parse(data) : null;
};

export const getTrips = async (): Promise<Trip[]> => {
  const data = localStorage.getItem(STORAGE_KEY_TRIPS);
  if (data) {
    const parsed = JSON.parse(data);
    // Migration helper for old data structure if needed
    return parsed.map((t: any) => ({
      ...t,
      cities: t.cities || [t.destination],
      budgetBRL: t.budgetBRL || 5000,
      currencies: t.currencies || [{ code: 'USD', rateToBRL: 5.0 }],
      expenses: t.expenses || [],
      notes: t.notes || ''
    }));
  }
  return [];
};

export const saveTrip = async (trip: Trip): Promise<void> => {
  const trips = await getTrips();
  const existingIndex = trips.findIndex(t => t.id === trip.id);
  
  if (existingIndex >= 0) {
    trips[existingIndex] = trip;
  } else {
    trips.push(trip);
  }
  
  localStorage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(trips));
};

export const deleteTrip = async (tripId: string): Promise<void> => {
  const trips = await getTrips();
  const newTrips = trips.filter(t => t.id !== tripId);
  localStorage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(newTrips));
};