# MotorX — Arquitectura del Frontend

## 1. Descripción General

**MotorX** es una aplicación web para la gestión de un taller de motocicletas. El frontend está construido con **Angular 20** y consume una API REST desarrollada en Java (Spring Boot). La aplicación permite a clientes gestionar sus vehículos y agendar citas, mientras que los administradores pueden controlar la agenda, empleados, usuarios y vehículos del taller.

### Stack Tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| Angular | 20.3.0 | Framework principal |
| TypeScript | 5.x | Lenguaje |
| Bootstrap | 5.x | Sistema de diseño y componentes UI |
| Bootstrap Icons | 1.x | Iconografía |
| SSR (Server-Side Rendering) | Integrado | Renderizado del lado del servidor |

### Prácticas de Angular 20 aplicadas

- **Standalone Components** — todos los componentes son standalone, sin `NgModule`.
- **Signals** — estado reactivo con `signal()`, `computed()` y `effect()`.
- **`inject()`** — inyección de dependencias funcional en lugar de constructores.
- **Zoneless Change Detection** — `provideZonelessChangeDetection()` sin Zone.js.
- **Modern Control Flow** — `@if`, `@for`, `@else`, `@empty` en templates.
- **Lazy Loading** — todos los componentes se cargan bajo demanda con `loadComponent()`.
- **Functional Guards & Interceptors** — `CanActivateFn` y `HttpInterceptorFn`.

---

## 2. Estructura de Archivos

```
src/app/
├── app.ts                          # Componente raíz
├── app.html                        # Template raíz (<router-outlet />)
├── app.css                         # Estilos globales del componente
├── app.config.ts                   # Configuración de providers
├── app.config.server.ts            # Configuración SSR
├── app.routes.ts                   # Definición de rutas
├── app.routes.server.ts            # Rutas SSR (RenderMode.Client)
│
├── models/                         # DTOs e interfaces
│   ├── index.ts                    # Barrel export
│   ├── enums.ts                    # Enums con labels en español
│   ├── auth.model.ts               # DTOs de autenticación
│   ├── appointment.model.ts        # DTOs de citas
│   ├── vehicle.model.ts            # DTOs de vehículos
│   ├── employee.model.ts           # DTOs de empleados
│   ├── admin-user.model.ts         # DTO de usuario administrativo
│   └── error.model.ts              # DTO de error
│
├── services/                       # Servicios HTTP y utilidades
│   ├── api.config.ts               # Constante BASE_API
│   ├── auth.interceptor.ts         # Interceptor JWT
│   ├── auth.service.ts             # Autenticación y sesión
│   ├── password-reset.service.ts   # Recuperación de contraseña
│   ├── theme.service.ts            # Modo claro/oscuro
│   ├── user-appointment.service.ts # Citas (cliente)
│   ├── user-vehicle.service.ts     # Vehículos (cliente)
│   ├── admin-appointment.service.ts# Citas (admin)
│   ├── admin-employee.service.ts   # Empleados (admin)
│   ├── admin-user.service.ts       # Usuarios (admin)
│   └── admin-vehicle.service.ts    # Vehículos (admin)
│
├── guards/
│   └── auth.guard.ts               # authGuard, adminGuard, guestGuard
│
└── components/                     # Componentes de la UI
    ├── login/                      # Inicio de sesión + 2FA
    ├── register/                   # Registro de usuario
    ├── forgot-password/            # Solicitar código de reset
    ├── reset-password/             # Restablecer contraseña
    ├── layout/                     # Shell con navbar y router-outlet
    ├── dashboard/                  # Panel principal del cliente
    ├── vehicle-list/               # CRUD de vehículos (cliente)
    ├── appointment-list/           # Listado de citas (cliente)
    ├── create-appointment/         # Wizard de creación de cita
    ├── admin-agenda/               # Agenda diaria (admin)
    ├── admin-calendar/             # Calendario por rango (admin)
    ├── admin-employees/            # CRUD de empleados (admin)
    ├── admin-users/                # Gestión de usuarios (admin)
    ├── admin-vehicles/             # Gestión de vehículos (admin)
    └── admin-unplanned/            # Cita imprevista (admin)
```

Cada componente tiene tres archivos separados: `.ts` (lógica), `.html` (template) y `.css` (estilos).

---

## 3. Configuración de la Aplicación

### `app.config.ts`

Registra los providers globales:

```typescript
providers: [
  provideBrowserGlobalErrorListeners(),
  provideZonelessChangeDetection(),
  provideRouter(routes),
  provideClientHydration(withEventReplay()),
  provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
]
```

- **`provideZonelessChangeDetection()`** — Elimina Zone.js; Angular detecta cambios mediante signals.
- **`provideHttpClient(withFetch(), withInterceptors(...))`** — Configura HttpClient con `fetch` API y el interceptor de autenticación.
- **`provideClientHydration(withEventReplay())`** — Habilita la hidratación del SSR con replay de eventos.

### `api.config.ts`

```typescript
export const BASE_API = 'http://localhost:8080/api';
```

Constante centralizada que define la URL base del backend. Todos los servicios la importan.

---

## 4. Sistema de Autenticación

### Flujo de autenticación

```
┌─────────┐     POST /auth/login      ┌──────────┐
│  Login   │ ──────────────────────── │  Backend  │
│Component │                          │           │
│          │ ◄─ { message: "2FA..." } │           │
│          │                          │           │
│  (2FA)   │  POST /auth/verify-2fa   │           │
│          │ ────────────────────────  │           │
│          │ ◄─ AuthResponseDTO       │           │
│          │    { token, role, ... }   │           │
└─────────┘                           └──────────┘
      │
      ▼
  localStorage:
  - motorx_token
  - motorx_role
  - motorx_user_name
  - motorx_user_id
```

1. **Login** — El usuario envía email/password. Si no es admin, el backend responde pidiendo 2FA.
2. **2FA** — El usuario ingresa el código recibido por email. El backend responde con `AuthResponseDTO`.
3. **handleAuthResponse()** — Guarda el JWT token y datos del usuario en `localStorage`.
4. **Interceptor** — En cada request HTTP subsecuente, el `authInterceptor` adjunta `Authorization: Bearer <token>`.

### `AuthService`

Servicio singleton (`providedIn: 'root'`) que gestiona el estado de sesión con signals:

| Signal / Computed | Tipo | Descripción |
|---|---|---|
| `_token` | `signal<string \| null>` | JWT actual |
| `_currentUser` | `signal<UserDTO \| null>` | Datos del usuario |
| `isLoggedIn` | `computed<boolean>` | `true` si hay token |
| `isAdmin` | `computed<boolean>` | `true` si rol es ADMIN |

**Métodos principales:** `login()`, `verify2FA()`, `register()`, `getMe()`, `logout()`, `refreshToken()`, `clearSession()`.

### Interceptor HTTP

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  if (token) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  return next(req);
};
```

Interceptor funcional que clona cada request HTTP y le añade el header de autorización JWT si existe un token en sesión.

---

## 5. Guards de Navegación

Definidos en `guards/auth.guard.ts` como funciones `CanActivateFn`:

| Guard | Protege | Comportamiento |
|---|---|---|
| `authGuard` | Rutas autenticadas | Redirige a `/login` si no hay sesión |
| `adminGuard` | Rutas de administrador | Redirige a `/login` si no es ADMIN |
| `guestGuard` | Rutas públicas (login, register) | Redirige a `/dashboard` o `/admin` si ya tiene sesión |

---

## 6. Sistema de Rutas

Todas las rutas usan **lazy loading** con `loadComponent()`:

### Rutas Públicas (protegidas por `guestGuard`)

| Ruta | Componente | Descripción |
|---|---|---|
| `/login` | `Login` | Inicio de sesión con 2FA |
| `/register` | `Register` | Registro de nuevo usuario |
| `/forgot-password` | `ForgotPassword` | Solicitar código de recuperación |
| `/reset-password` | `ResetPassword` | Ingresar token y nueva contraseña |

### Rutas de Cliente (bajo `Layout`, protegidas por `authGuard`)

| Ruta | Componente | Descripción |
|---|---|---|
| `/dashboard` | `Dashboard` | Panel principal con accesos rápidos y citas próximas |
| `/vehicles` | `VehicleList` | CRUD completo de vehículos del usuario |
| `/appointments` | `AppointmentList` | Listado de citas con estados y acciones |
| `/appointments/new` | `CreateAppointment` | Wizard de 3 pasos para crear cita |

### Rutas de Administrador (bajo `Layout`, protegidas por `authGuard` + `adminGuard`)

| Ruta | Componente | Descripción |
|---|---|---|
| `/admin` | `AdminAgenda` | Agenda del día con acciones de cancelación |
| `/admin/calendar` | `AdminCalendar` | Vista de calendario por rango de fechas |
| `/admin/employees` | `AdminEmployees` | CRUD de empleados con cargo y estado |
| `/admin/users` | `AdminUsers` | Gestión de usuarios (bloquear/desbloquear/eliminar) |
| `/admin/vehicles` | `AdminVehicles` | Listado de vehículos con transferencia de propiedad |
| `/admin/unplanned` | `AdminUnplanned` | Formulario para citas imprevistas |

### Redirecciones

- `/` → `/dashboard` (usuarios autenticados)
- `/**` → `/login` (ruta no encontrada)

---

## 7. Modelos y DTOs

Todos los modelos están definidos como `interface` en TypeScript y reflejan exactamente los DTOs del backend documentados en `APIDOC.md`.

### Enums

| Enum | Valores |
|---|---|
| `Role` | `CLIENT`, `EMPLOYEE`, `ADMIN` |
| `AppointmentType` | `MANUAL_WARRANTY_REVIEW`, `AUTECO_WARRANTY`, `QUICK_SERVICE`, `MAINTENANCE`, `OIL_CHANGE`, `UNPLANNED`, `REWORK` |
| `AppointmentStatus` | `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `REJECTED`, `NO_SHOW` |
| `EmployeePosition` | `RECEPCIONISTA`, `MECANICO` |
| `EmployeeState` | `AVAILABLE`, `NOT_AVAILABLE` |

Cada enum tiene un mapa de **labels en español** asociado (e.g. `APPOINTMENT_TYPE_LABELS`) para mostrar valores legibles al usuario.

### DTOs de Autenticación (`auth.model.ts`)

- `LoginRequestDTO` — `{ email, password }`
- `Verify2FADTO` — `{ email, code }`
- `RegisterUserDTO` — `{ name, dni, email, password, phone }`
- `AuthResponseDTO` — `{ token, role, name, userId }`
- `UserDTO` — `{ id, name, dni, email, phone, role, enabled, ... }`
- `PasswordResetRequestDTO` — `{ email }`
- `PasswordResetDTO` — `{ token, newPassword }`

### DTOs de Citas (`appointment.model.ts`)

- `CreateAppointmentRequestDTO` — vehicleId, type, date, time, mileage, notes
- `CreateUnplannedAppointmentRequestDTO` — vehicleId, type, date, time, mileage, technicianId, adminNotes
- `CancelAppointmentRequestDTO` — reason, notifyClient
- `UpdateAppointmentTechnicianRequestDTO` — newTechnicianId
- `AppointmentResponseDTO` — datos completos de la cita
- `AvailableSlotDTO` / `AvailableSlotsResponseDTO` — horarios disponibles
- `LicensePlateRestrictionResponseDTO` — validación de pico y placa
- `ReworkRedirectResponseDTO` — información de reproceso

### DTOs de Vehículos (`vehicle.model.ts`)

- `CreateVehicleRequestDTO` — brand, model, yearOfManufacture, licensePlate, cylinderCapacity, chassisNumber
- `UpdateVehicleRequestDTO` — brand, model, cylinderCapacity
- `TransferVehicleOwnershipRequestDTO` — `{ newOwnerId }`
- `VehicleResponseDTO` — datos completos del vehículo con ownerEmail

### DTOs de Empleados (`employee.model.ts`)

- `CreateEmployeeRequestDTO` — `{ position, user: RegisterUserDTO }`
- `UpdateEmployeeRequestDTO` — `{ position, state }`
- `EmployeeResponseDTO` — employeeId, position, state, userName, userEmail, etc.

### DTO de Usuario Admin (`admin-user.model.ts`)

- `AdminUserResponseDTO` — id, name, dni, email, phone, role, enabled, accountLocked, timestamps

### DTO de Error (`error.model.ts`)

- `ResponseErrorDTO` — timestamp, status, error, message, path

### Barrel Export (`index.ts`)

Reexporta todos los modelos y enums desde un punto único para imports limpios:

```typescript
import { LoginRequestDTO, VehicleResponseDTO, Role } from '../models';
```

---

## 8. Servicios

Todos los servicios usan `inject(HttpClient)` y la constante `BASE_API`. Son `providedIn: 'root'`.

### Servicios de Cliente

| Servicio | Endpoints que consume | Funcionalidad |
|---|---|---|
| `AuthService` | `/auth/*` | Login, 2FA, registro, logout, refresh, getMe |
| `PasswordResetService` | `/auth/forgot-password`, `/auth/reset-password` | Recuperación de contraseña |
| `UserVehicleService` | `/client/vehicles/*` | CRUD de vehículos propios |
| `UserAppointmentService` | `/client/appointments/*` | Crear, listar, cancelar citas; consultar slots y restricciones |

### Servicios de Administrador

| Servicio | Endpoints que consume | Funcionalidad |
|---|---|---|
| `AdminAppointmentService` | `/admin/appointments/*` | Agenda, calendario, crear imprevista, cancelar, reasignar técnico |
| `AdminEmployeeService` | `/admin/employees/*` | CRUD de empleados |
| `AdminUserService` | `/admin/users/*` | Listar, bloquear/desbloquear, eliminar usuarios |
| `AdminVehicleService` | `/admin/vehicles/*` | Listar vehículos, transferir propiedad |

### Servicio de Tema

| Servicio | Funcionalidad |
|---|---|
| `ThemeService` | Toggle claro/oscuro con persistencia en `localStorage` y atributos `data-bs-theme` / `data-theme` en el `<html>` |

---

## 9. Componentes

### 9.1 Autenticación

#### `Login`
- Formulario de email/password.
- Al hacer login, si el backend indica 2FA, muestra un campo para el código.
- Usa signals para controlar el estado del formulario (loading, step, error).
- Redirige según rol: ADMIN → `/admin`, CLIENT → `/dashboard`.

#### `Register`
- Formulario con campos: nombre, DNI, email, contraseña, teléfono.
- Validación de errores campo por campo desde el backend.
- Auto-login tras registro exitoso.

#### `ForgotPassword`
- Campo de email para solicitar código de recuperación.
- Muestra mensaje de éxito tras enviar.

#### `ResetPassword`
- Campos: token recibido por email + nueva contraseña.
- Redirige a `/login` tras reseteo exitoso.

### 9.2 Layout

#### `Layout`
- **Shell de la aplicación** — contiene navbar y `<router-outlet>` para hijos.
- **Navbar** con dos secciones de navegación:
  - **Cliente:** Dashboard, Vehículos, Citas.
  - **Admin:** Agenda, Calendario, Empleados, Usuarios, Vehículos, Cita Imprevista.
- Muestra el nombre del usuario desde `AuthService`.
- Botón de **toggle de tema** (sol/luna) integrado.
- Menú desplegable con opción de **cerrar sesión**.
- La navegación de admin solo se muestra si `authService.getStoredRole() === 'ADMIN'`.

### 9.3 Componentes de Cliente

#### `Dashboard`
- Tarjetas de acceso rápido: Mis Vehículos, Nueva Cita, Mis Citas.
- Tabla con las próximas citas del usuario.
- Estadísticas rápidas (total vehículos, total citas, citas pendientes).

#### `VehicleList`
- Grid de tarjetas mostrando los vehículos del usuario.
- Formulario inline para **crear** y **editar** vehículos.
- Acción de **eliminar** con confirmación.
- Campos: placa, marca, modelo, año, cilindrada, chasis.

#### `AppointmentList`
- Tabla con todas las citas del usuario.
- Badges de color según estado (SCHEDULED → azul, COMPLETED → verde, CANCELLED → rojo, etc.).
- Acción de **cancelar** citas con estado SCHEDULED.

#### `CreateAppointment`
- **Wizard de 3 pasos:**
  1. **Vehículo y tipo** — Selecciona vehículo y tipo de servicio. Verifica restricción de pico y placa. Si es REWORK, consulta información de reproceso.
  2. **Horario** — Selecciona fecha, carga slots disponibles desde el backend, elige horario.
  3. **Confirmación** — Resumen con opción de agregar notas. Envía la cita.
- Maneja `currentMileage` y `clientNotes`.

### 9.4 Componentes de Administrador

#### `AdminAgenda`
- Vista de agenda del día.
- Selector de fecha con carga automática.
- Tabla con citas del día: hora, placa, tipo, técnico, estado.
- Modal de cancelación con campos de razón y checkbox de notificar al cliente.

#### `AdminCalendar`
- Selección de rango de fechas (inicio y fin).
- Carga citas en un rango y las agrupa por fecha.
- Muestra cada día como sección con su tabla de citas.

#### `AdminEmployees`
- Tabla de empleados con nombre, email, cargo, estado, teléfono.
- Formulario inline para **crear** nuevo empleado (incluye datos de usuario: nombre, DNI, email, contraseña, teléfono).
- **Editar** empleado: cambiar cargo y estado.
- **Eliminar** con confirmación.
- Usa los enums `EmployeePosition` y `EmployeeState`.

#### `AdminUsers`
- Tabla de usuarios con nombre, email, rol (badge de color), estado.
- Acciones: **bloquear** / **desbloquear** y **eliminar** (soft delete).
- Los badges de rol son: CLIENT → info, EMPLOYEE → warning, ADMIN → danger.

#### `AdminVehicles`
- Tabla de vehículos con placa, marca, modelo, año, cilindrada, propietario.
- Acción de **transferir propiedad** mediante modal.
- El modal pide el ID del nuevo propietario y confirma la transferencia.

#### `AdminUnplanned`
- Formulario completo para crear una cita imprevista.
- Campos: vehículo (select con datos del backend), tipo de cita, fecha, hora, kilometraje, técnico (opcional), notas.
- Carga la lista de vehículos y empleados al inicializar.

---

## 10. Sistema de Temas (Modo Claro/Oscuro)

### Funcionamiento

```
ThemeService (signal)
       │
       ▼
   effect() ──► document.documentElement
                ├── data-bs-theme="light|dark"  (Bootstrap)
                └── data-theme="light|dark"     (CSS custom)
       │
       ▼
   localStorage.motorx_theme
```

1. `ThemeService` mantiene un signal `_theme` con valor `'light'` o `'dark'`.
2. Un `effect()` sincroniza el valor con:
   - `data-bs-theme` en el `<html>` → Bootstrap adapta colores automáticamente.
   - `data-theme` en el `<html>` → CSS custom properties (variables propias de MotorX).
   - `localStorage` → persistencia entre sesiones.
3. Al cargar, verifica `localStorage` y si no hay valor, respeta `prefers-color-scheme` del sistema operativo.

### Variables CSS

Las variables definidas en `styles.css` cubren:

- Colores de fondo, texto y bordes (`--mx-bg`, `--mx-text`, `--mx-border`).
- Colores del brand (`--mx-primary`, `--mx-primary-hover`).
- Colores de tarjetas, inputs, sidebar (`--mx-card-bg`, `--mx-input-bg`).
- Se aplican por defecto para `[data-theme="light"]` y se sobreescriben para `[data-theme="dark"]`.

---

## 11. Estilos Globales

Definidos en `src/styles.css`:

- **CSS Custom Properties** — Variables para ambos temas.
- **Overrides de Bootstrap** — Botones primarios con colores del brand, tablas con bordes suaves, badges de estado.
- **Clases de estado** — `.badge-SCHEDULED`, `.badge-COMPLETED`, `.badge-CANCELLED`, etc.
- **Formularios** — Inputs estilizados para ambos temas.
- **Scrollbar** — Personalizada para Chrome/Edge.
- **Utilidades** — `.mx-card`, animaciones de hover en tarjetas.

### Paleta de colores del Brand

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--mx-primary` | `#0d6efd` | `#3d8bfd` | Botones, links, acentos |
| `--mx-bg` | `#f5f7fa` | `#121212` | Fondo general |
| `--mx-card-bg` | `#ffffff` | `#1e1e1e` | Tarjetas y paneles |
| `--mx-text` | `#212529` | `#e0e0e0` | Texto principal |

---

## 12. Comunicación con el Backend

### URL Base

```
http://localhost:8080/api
```

### Patrón de consumo

Todos los servicios siguen el mismo patrón:

```typescript
@Injectable({ providedIn: 'root' })
export class SomeService {
  private readonly http = inject(HttpClient);

  getData(): Observable<ResponseDTO[]> {
    return this.http.get<ResponseDTO[]>(`${BASE_API}/endpoint`);
  }

  createItem(dto: CreateDTO): Observable<ResponseDTO> {
    return this.http.post<ResponseDTO>(`${BASE_API}/endpoint`, dto);
  }
}
```

### Endpoints consumidos

| Grupo | Método | Endpoint | Servicio |
|---|---|---|---|
| **Auth** | POST | `/auth/login` | AuthService |
| | POST | `/auth/verify-2fa` | AuthService |
| | POST | `/auth/register` | AuthService |
| | GET | `/auth/me` | AuthService |
| | GET | `/auth/logout` | AuthService |
| | POST | `/auth/refresh` | AuthService |
| | POST | `/auth/forgot-password` | PasswordResetService |
| | POST | `/auth/reset-password` | PasswordResetService |
| **Client Vehicles** | GET | `/client/vehicles` | UserVehicleService |
| | GET | `/client/vehicles/:id` | UserVehicleService |
| | POST | `/client/vehicles` | UserVehicleService |
| | PUT | `/client/vehicles/:id` | UserVehicleService |
| | DELETE | `/client/vehicles/:id` | UserVehicleService |
| **Client Appointments** | GET | `/client/appointments` | UserAppointmentService |
| | GET | `/client/appointments/:id` | UserAppointmentService |
| | POST | `/client/appointments` | UserAppointmentService |
| | PUT | `/client/appointments/:id/cancel` | UserAppointmentService |
| | GET | `/client/appointments/vehicle/:id` | UserAppointmentService |
| | GET | `/client/appointments/available-slots` | UserAppointmentService |
| | GET | `/client/appointments/check-plate-restriction` | UserAppointmentService |
| | GET | `/client/appointments/rework-info/:vehicleId` | UserAppointmentService |
| **Admin Appointments** | GET | `/admin/appointments/agenda` | AdminAppointmentService |
| | GET | `/admin/appointments/calendar` | AdminAppointmentService |
| | GET | `/admin/appointments/available-slots` | AdminAppointmentService |
| | GET | `/admin/appointments/:id` | AdminAppointmentService |
| | POST | `/admin/appointments/unplanned` | AdminAppointmentService |
| | PUT | `/admin/appointments/:id/cancel` | AdminAppointmentService |
| | PUT | `/admin/appointments/:id/technician` | AdminAppointmentService |
| | GET | `/admin/appointments/client/:id` | AdminAppointmentService |
| | GET | `/admin/appointments/vehicle/:id` | AdminAppointmentService |
| **Admin Employees** | GET | `/admin/employees` | AdminEmployeeService |
| | GET | `/admin/employees/:id` | AdminEmployeeService |
| | POST | `/admin/employees` | AdminEmployeeService |
| | PUT | `/admin/employees/:id` | AdminEmployeeService |
| | DELETE | `/admin/employees/:id` | AdminEmployeeService |
| **Admin Users** | GET | `/admin/users` | AdminUserService |
| | GET | `/admin/users/:id` | AdminUserService |
| | PUT | `/admin/users/:id/block` | AdminUserService |
| | PUT | `/admin/users/:id/unblock` | AdminUserService |
| | DELETE | `/admin/users/:id` | AdminUserService |
| **Admin Vehicles** | GET | `/admin/vehicles` | AdminVehicleService |
| | GET | `/admin/vehicles/:id` | AdminVehicleService |
| | PUT | `/admin/vehicles/:id/transfer` | AdminVehicleService |

---

## 13. Seguridad

| Mecanismo | Implementación |
|---|---|
| **JWT Bearer Token** | Almacenado en `localStorage`, adjuntado vía interceptor |
| **2FA** | Código por email para usuarios no-admin en el login |
| **Guards de ruta** | `authGuard` (sesión), `adminGuard` (rol ADMIN), `guestGuard` (sin sesión) |
| **Lazy Loading** | Los componentes admin solo se descargan si el usuario navega a esas rutas |
| **SSR Platform Check** | `isPlatformBrowser()` protege accesos a `localStorage` y `document` |

---

## 14. Cómo ejecutar

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
ng serve

# Build de producción
ng build

# La app estará disponible en http://localhost:4200
# Se conecta al backend en http://localhost:8080/api
```

Para cambiar la URL del backend, editar `src/app/services/api.config.ts`:

```typescript
export const BASE_API = 'https://tu-servidor.com/api';
```
