import { useEffect, useState } from 'react';
import { getState, subscribe } from '@/data/store';
import type { AppState } from '@/data/types';

export function useStore(): AppState {
  const [state, setState] = useState(getState);
  useEffect(() => subscribe(() => setState(getState())), []);
  return state;
}
