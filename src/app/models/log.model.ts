export type LogServiceName =
  | 'AUTHENTICATION'
  | 'USER'
  | 'PASSWORD_RESET'
  | 'APPOINTMENT'
  | 'VEHICLE'
  | 'ADMIN';

export type LogActionType =
  | 'LOGIN'
  | 'REGISTER'
  | 'LOGOUT'
  | 'VERIFY_2FA'
  | 'REFRESH_TOKEN'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_CONFIRM'
  | 'UPDATE_USER_PROFILE'
  | 'SCHEDULE_APPOINTMENT'
  | 'CANCEL_APPOINTMENT';

export type LogResult = 'SUCCESS' | 'FAILURE';

export interface LogResponseDTO {
  id: number;
  serviceName: LogServiceName;
  actionType: LogActionType;
  result: LogResult;
  actorEmail: string | null;
  actorUserId: number | null;
  message: string;
  createdAt: string;
}

export interface LogPageResponseDTO {
  content: LogResponseDTO[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
