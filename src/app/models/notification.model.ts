export type NotificationUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CreateNotificationDTO {
  userId: number;
  title: string;
  description: string;
  urgency: NotificationUrgency;
  source?: string;
}

export interface NotificationResponseDTO {
  id: number;
  userId: number;
  title: string;
  description: string;
  urgency: NotificationUrgency;
  isRead: boolean;
  readAt: string | null;
  source: string | null;
  createdAt: string;
}

export interface MarkAllNotificationsReadResponseDTO {
  updatedCount: number;
  message: string;
}

