export type LogServiceName =
  | 'AUTHENTICATION'
  | 'USER'
  | 'PASSWORD_RESET'
  | 'APPOINTMENT'
  | 'VEHICLE'
  | 'ADMIN'
  | 'SPARE'
  | 'INVENTORY'
  | 'RECEPTION'
  | 'NOTIFICATION';

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
  | 'CANCEL_APPOINTMENT'
  | 'CREATE_SPARE'
  | 'UPDATE_SPARE'
  | 'UPDATE_SPARE_PURCHASE_PRICE'
  | 'DELETE_SPARE'
  | 'REGISTER_PURCHASE'
  | 'REGISTER_SALE'
  | 'INITIATE_RECEPTION'
  | 'CONFIRM_RECEPTION'
  | 'CREATE_NOTIFICATION'
  | 'READ_NOTIFICATION'
  | 'READ_ALL_NOTIFICATIONS';

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
