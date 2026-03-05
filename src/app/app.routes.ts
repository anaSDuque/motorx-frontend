import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  /* ── Guest routes (no auth) ── */
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./components/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./components/register/register').then((m) => m.Register),
  },
  {
    path: 'about-us',
    loadComponent: () =>
      import('./components/about-us/about-us').then((m) => m.AboutUs),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./components/forgot-password/forgot-password').then(
        (m) => m.ForgotPassword
      ),
  },
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./components/reset-password/reset-password').then(
        (m) => m.ResetPassword
      ),
  },

  /* ── Authenticated routes (Layout shell) ── */
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/layout/layout').then((m) => m.Layout),
    children: [
      /* Client routes */
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'vehicles',
        loadComponent: () =>
          import('./components/vehicle-list/vehicle-list').then(
            (m) => m.VehicleList
          ),
      },
      {
        path: 'appointments',
        loadComponent: () =>
          import('./components/appointment-list/appointment-list').then(
            (m) => m.AppointmentList
          ),
      },
      {
        path: 'appointments/new',
        loadComponent: () =>
          import('./components/create-appointment/create-appointment').then(
            (m) => m.CreateAppointment
          ),
      },

      /* Admin routes */
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./components/admin-agenda/admin-agenda').then(
            (m) => m.AdminAgenda
          ),
      },
      {
        path: 'admin/calendar',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./components/admin-calendar/admin-calendar').then(
            (m) => m.AdminCalendar
          ),
      },
      {
        path: 'admin/employees',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./components/admin-employees/admin-employees').then(
            (m) => m.AdminEmployees
          ),
      },
      {
        path: 'admin/users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./components/admin-users/admin-users').then(
            (m) => m.AdminUsers
          ),
      },
      {
        path: 'admin/vehicles',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./components/admin-vehicles/admin-vehicles').then(
            (m) => m.AdminVehicles
          ),
      },
      {
        path: 'admin/unplanned',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./components/admin-unplanned/admin-unplanned').then(
            (m) => m.AdminUnplanned
          ),
      },

      /* Default redirect */
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  /* Fallback */
  { path: '**', redirectTo: 'login' },
];
