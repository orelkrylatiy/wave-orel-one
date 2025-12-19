// Сервис для работы с GigaChat API через прокси-сервер

interface GigaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ProxyResponse {
  reply: string;
  model: string;
  created: number;
}

class GigaChatService {
  private proxyUrl: string;

  constructor() {
    // URL прокси-сервера
    this.proxyUrl = 'http://localhost:3001/api/chat';
  }

  // Отправка сообщения в чат через прокси
  async sendMessage(messages: GigaChatMessage[], temperature: number = 0.7): Promise<string> {
    try {
      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          temperature: temperature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Ошибка прокси: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const data: ProxyResponse = await response.json();
      return data.reply;
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      throw error;
    }
  }

  // Проверка работы прокси-сервера
  async checkStatus(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3001/api/status');
      return response.ok;
    } catch {
      return false;
    }
  }

  // Проверка конфигурации (теперь проверяем доступность прокси)
  isConfigured(): boolean {
    return true; // Всегда true, так как credentials на прокси
  }
}

export const gigaChatService = new GigaChatService();
