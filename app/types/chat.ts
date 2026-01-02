
/**
 * Un participant dans la conversation
 */
export type User = {
  id: string;          // Identifiant unique
  name: string;        // Nom affiché 
  role: "user" | "ai"; // Type de participant
};

/**
 * Un message dans la conversation
 */
export type Message = {
  id: string;        // ID unique du message
  userId: string;    // ID de l'auteur 
  content: string;   // Contenu du message
  timestamp: number; // Date en milliseconds 
};

/**
 * État complet de la conversation
 */
export type Conversation = {
  messages: Message[]; // Historique des messages
  users: User[];       // Liste des participants
};

/**
 * État de l'interface utilisateur
 */
export type ChatUIState = {
  conversation: Conversation;
  currentUserId: string;  // L'utilisateur actuellement sélectionné
  isLoading: boolean;     
};

/**
 * Requête envoyée à l'API pour obtenir une réponse de l'IA
 */
export type ChatRequest = {
  messages: Message[]; // Messages à envoyer
  users: User[];       // Participants pour le contexte
  reset?: boolean; // 🔹 AJOUTÉ
};

/**
 * Réponse de l'API
 */
export type ChatResponse = {
  message: Message; // Le message généré par l'IA
};