# 📐 Архитектура проекта BrainWave

## 1️⃣ Общая архитектура системы

```mermaid
graph TB
    subgraph "Client Browser"
        UI[React SPA<br/>Vite + TypeScript]
        Store[Local State<br/>useState]
        UI --> Store
    end
    
    subgraph "Proxy Server :3001"
        Express[Express.js]
        TokenCache[Token Cache<br/>30min TTL]
        Express --> TokenCache
    end
    
    subgraph "Sberbank Cloud"
        OAuth[OAuth API<br/>:9443]
        GigaChat[GigaChat API<br/>Chat Completions]
    end
    
    UI -->|HTTP POST /api/chat| Express
    Express -->|1. Get Token| OAuth
    OAuth -->|Access Token| TokenCache
    Express -->|2. Chat Request<br/>Bearer Token| GigaChat
    GigaChat -->|AI Response| Express
    Express -->|JSON Response| UI
    
    style UI fill:#4f46e5,color:#fff
    style Express fill:#10b981,color:#fff
    style GigaChat fill:#f59e0b,color:#fff
```

## 2️⃣ Структура компонентов React

```mermaid
graph TD
    App[App.tsx<br/>Root Component]
    
    App --> Sidebar[Sidebar<br/>Navigation]
    App --> Header[Header<br/>Theme Toggle]
    App --> Router{Route Switch<br/>activeTab state}
    
    Router --> Home[Home<br/>Dashboard Cards]
    Router --> AITutor[AITutor ⭐<br/>Chat Interface]
    Router --> Materials[Materials<br/>Learning Content]
    Router --> Assignments[Assignments<br/>Tasks Tracker]
    Router --> Progress[Progress<br/>Statistics]
    Router --> Settings[Settings<br/>Configuration]
    Router --> AboutUs[AboutUs<br/>Info Page]
    
    AITutor --> GigaChatService[gigaChatService<br/>API Client]
    GigaChatService -->|Fetch API| ProxyServer[Proxy Server]
    
    subgraph "UI Component Library"
        RadixUI[Radix UI<br/>Primitives]
        Lucide[Lucide Icons]
    end
    
    App -.uses.-> RadixUI
    App -.uses.-> Lucide
    
    style App fill:#6366f1,color:#fff
    style AITutor fill:#ec4899,color:#fff
    style GigaChatService fill:#10b981,color:#fff
```

## 3️⃣ Архитектура компонента AITutor

```mermaid
sequenceDiagram
    participant U as User
    participant AI as AITutor Component
    participant S as gigaChatService
    participant P as Proxy Server
    participant G as GigaChat API
    
    U->>AI: Вводит сообщение + Enter
    activate AI
    AI->>AI: Добавить userMessage в state
    AI->>AI: setIsLoading(true)
    
    AI->>S: sendMessage([system, user])
    activate S
    S->>P: POST /api/chat
    activate P
    
    alt Token not cached
        P->>G: POST /oauth (Auth)
        G-->>P: access_token
        P->>P: Cache token (30min)
    end
    
    P->>G: POST /chat/completions
    G-->>P: AI Response
    P-->>S: { reply, model, created }
    deactivate P
    S-->>AI: response string
    deactivate S
    
    AI->>AI: Добавить aiMessage в state
    AI->>AI: setIsLoading(false)
    AI-->>U: Отображает ответ в UI
    deactivate AI
```

## 4️⃣ Поток данных в приложении

```mermaid
flowchart LR
    subgraph State["Application State"]
        direction TB
        GS[Global State<br/>App.tsx]
        LS[Local State<br/>Component-level]
    end
    
    subgraph Components["UI Components"]
        direction TB
        C1[Sidebar]
        C2[AITutor]
        C3[Other Pages]
    end
    
    subgraph Services["Service Layer"]
        API[gigaChatService]
    end
    
    subgraph External["External APIs"]
        Proxy[Proxy :3001]
    end
    
    GS -->|props| C1
    GS -->|props| C2
    GS -->|props| C3
    
    LS --> C2
    C2 -->|async call| API
    API -->|HTTP| Proxy
    Proxy -->|response| API
    API -->|return| C2
    C2 -->|setState| LS
    
    style GS fill:#818cf8,color:#fff
    style API fill:#34d399,color:#fff
    style Proxy fill:#fbbf24,color:#fff
```

## 5️⃣ OAuth 2.0 Flow с кэшированием

```mermaid
stateDiagram-v2
    [*] --> CheckCache: Request arrives
    
    CheckCache --> ValidToken: Token exists & valid
    CheckCache --> RequestToken: Token expired/missing
    
    RequestToken --> OAuth: POST /oauth
    OAuth --> CacheToken: Store token + expiry
    CacheToken --> ValidToken
    
    ValidToken --> CallAPI: Use cached token
    CallAPI --> CheckExpiry: After API call
    
    CheckExpiry --> [*]: Success
    CheckExpiry --> RequestToken: 401 Unauthorized
```

## 6️⃣ Режимы работы AI Репетитора

```mermaid
graph LR
    User[User Input]
    
    User --> Mode{Mode Selection}
    
    Mode -->|question| Q[Question Mode]
    Mode -->|homework| H[Homework Mode]
    
    Q --> SP1["System Prompt:<br/>'Ты — AI репетитор<br/>Объясняй подробно,<br/>используй примеры кода'"]
    
    H --> SP2["System Prompt:<br/>'Ты — AI репетитор<br/>Проверяй ДЗ,<br/>указывай на ошибки'"]
    
    SP1 --> API[GigaChat API]
    SP2 --> API
    
    API --> Response[AI Response]
    
    style Q fill:#3b82f6,color:#fff
    style H fill:#8b5cf6,color:#fff
    style API fill:#f59e0b,color:#fff
```

## 📊 Технологический стек

| Уровень | Технологии |
|---------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **UI Components** | Radix UI, Lucide Icons |
| **Backend** | Node.js, Express.js |
| **AI API** | GigaChat (Sberbank) |
| **State Management** | React useState (Local) |
| **HTTP Client** | Fetch API, node-fetch |

## 🔐 Безопасность

```mermaid
graph LR
    Client[Browser Client]
    Proxy[Proxy Server<br/>Credentials Hidden]
    API[GigaChat API]
    
    Client -->|Public Endpoint| Proxy
    Proxy -->|API Key in .env| API
    
    style Proxy fill:#10b981,color:#fff
```

---

**Инструкция:**
1. Установите расширение [Markdown Preview Mermaid Support](vscode:extension/bierner.markdown-mermaid)
2. Откройте этот файл в VS Code
3. Нажмите `Ctrl+Shift+V` для preview
4. Сделайте скриншот или экспорт в PNG
