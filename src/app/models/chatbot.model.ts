export interface ChatbotRequestDTO {
  message: string;
}

export interface ChatbotResponseDTO {
  reply: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'bot';
  text: string;
  timestamp: string;
}
