import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { environment } from '../../../environments/environment';
import * as fromAuth from './auth/auth.reducer';

// Define the shape of the entire application state
export interface AppState {
  auth: fromAuth.AuthState;
  // Add additional state slices here as needed
}

// Combine all reducers
export const reducers: ActionReducerMap<AppState> = {
  auth: fromAuth.authReducer,
  // Add additional reducers here as needed
};

// Meta-reducers run before all reducers
export const metaReducers: MetaReducer<AppState>[] = !environment.production ? [] : [];
