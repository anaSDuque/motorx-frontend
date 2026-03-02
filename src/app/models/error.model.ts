export interface ResponseErrorDTO {
  code: number;
  message: string;
  details: Record<string, string> | null;
}
