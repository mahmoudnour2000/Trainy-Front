// import { Injectable } from '@angular/core';
// import { Actions, createEffect, ofType } from '@ngrx/effects';
// import { of } from 'rxjs';
// import { catchError, map, switchMap, tap } from 'rxjs/operators';
// import { Router } from '@angular/router';

// import { AuthService } from '../../services/auth.service';
// import * as AuthActions from './auth.actions';

// @Injectable()
// export class AuthEffects {
//   login$ = createEffect(() =>
//     this.actions$.pipe(
//       ofType(AuthActions.login),
//       switchMap(({ email, password }) =>
//         this.authService.login({ email, password }).pipe(
//           map((response) => AuthActions.loginSuccess({ user: response.user, token: response.token })),
//           catchError(error => of(AuthActions.loginFailure({ error: error.message })))
//         )
//       )
//     )
//   );

//   loginSuccess$ = createEffect(
//     () =>
//       this.actions$.pipe(
//         ofType(AuthActions.loginSuccess),
//         tap(({ token }) => {
//           localStorage.setItem('token', token);
//           this.router.navigate(['/']);
//         })
//       ),
//     { dispatch: false }
//   );

//   register$ = createEffect(() =>
//     this.actions$.pipe(
//       ofType(AuthActions.register),
//       switchMap(({ email, password, name }) =>
//         this.authService.register({ email, password, name, confirmPassword: password }).pipe(
//           map((response) => AuthActions.registerSuccess({ user: response.user, token: response.token })),
//           catchError(error => of(AuthActions.registerFailure({ error: error.message })))
//         )
//       )
//     )
//   );

//   registerSuccess$ = createEffect(
//     () =>
//       this.actions$.pipe(
//         ofType(AuthActions.registerSuccess),
//         tap(({ token }) => {
//           localStorage.setItem('token', token);
//           this.router.navigate(['/']);
//         })
//       ),
//     { dispatch: false }
//   );

//   logout$ = createEffect(() =>
//     this.actions$.pipe(
//       ofType(AuthActions.logout),
//       tap(() => {
//         this.authService.logout();
//         this.router.navigate(['/auth/login']);
//       }),
//       map(() => AuthActions.logoutSuccess())
//     )
//   );

//   getCurrentUser$ = createEffect(() =>
//     this.actions$.pipe(
//       ofType(AuthActions.getCurrentUser),
//       switchMap(() =>
//         this.authService.currentUser$.pipe(
//           map(user => {
//             if (user) {
//               return AuthActions.getCurrentUserSuccess({ user });
//             } else {
//               return AuthActions.getCurrentUserFailure({ error: 'User not found' });
//             }
//           }),
//           catchError(error => of(AuthActions.getCurrentUserFailure({ error: error.message })))
//         )
//       )
//     )
//   );

//   constructor(
//     private actions$: Actions,
//     private authService: AuthService,
//     private router: Router
//   ) {}
// }
