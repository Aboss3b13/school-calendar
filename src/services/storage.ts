import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppStateSnapshot } from '../types/models';

const STORAGE_KEY = 'schoolflow_state_v1';

export async function saveSnapshot(snapshot: AppStateSnapshot) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export async function loadSnapshot(): Promise<AppStateSnapshot | null> {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  if (!data) {
    return null;
  }

  try {
    return JSON.parse(data) as AppStateSnapshot;
  } catch {
    return null;
  }
}
