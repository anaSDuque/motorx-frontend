import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASE_API } from './api.config';
import { ChatbotRequestDTO, ChatbotResponseDTO } from '../models/chatbot.model';

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${BASE_API}/v1/chatbot`;

  sendMessage(dto: ChatbotRequestDTO): Observable<ChatbotResponseDTO> {
    return this.http.post<ChatbotResponseDTO>(`${this.baseUrl}/message`, dto);
  }
}
