import { createReducer, on } from '@ngrx/store';
import { AUser } from '../../models/auth';
import * as AuthActions from './auth.actions';

export interface AuthState {
  user: AUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export const initialAuthState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false
};

export const authReducer = createReducer(
  initialAuthState,
  
  // Login actions
  on(AuthActions.login, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AuthActions.loginSuccess, (state, { user, token }) => ({
    ...state,
    user,
    token,
    loading: false,
    error: null,
    isAuthenticated: true
  })),
  
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    isAuthenticated: false
  })),
  
  // Logout actions
  on(AuthActions.logout, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AuthActions.logoutSuccess, () => ({
    ...initialAuthState
  })),
  
  // Register actions
  on(AuthActions.register, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AuthActions.registerSuccess, (state, { user, token }) => ({
    ...state,
    user,
    token,
    loading: false,
    error: null,
    isAuthenticated: true
  })),
  
  on(AuthActions.registerFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    isAuthenticated: false
  })),
  
  // Get current user actions
  on(AuthActions.getCurrentUser, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AuthActions.getCurrentUserSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
    error: null,
    isAuthenticated: true
  })),
  
  on(AuthActions.getCurrentUserFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    isAuthenticated: false
  }))
);
