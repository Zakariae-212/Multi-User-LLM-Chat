import { NextRequest, NextResponse } from "next/server";
import { ChatRequest, ChatResponse, Message } from "@/app/types/chat";

// 🔹 Historique global (in-memory)
let conversationHistory: Message[] = [];

const MAX_HISTORY = 15;

/**
 * API Route pour gérer les requêtes de chat
 * POST /api/chat
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Lire la requête
    const body: ChatRequest = await request.json();
    const { messages, users, reset } = body;

// 🔹 SI NOUVELLE CONVERSATION → RESET SERVEUR
    if (reset) {
      conversationHistory = [];
      return NextResponse.json({ success: true });
    }

    if (!messages || !users) {
      return NextResponse.json(
        { error: "Messages et users sont requis" },
        { status: 400 }
      );
    }

    // 2. Vérifier la clé API
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Clé API non configurée" },
        { status: 500 }
      );
    }

    // 3. Mettre à jour l’historique serveur (max 15)
    conversationHistory = [...conversationHistory, ...messages].slice(
      -MAX_HISTORY
    );

    // 4. Construire le prompt
    const prompt = buildPrompt(conversationHistory, users);

    // 5. Appel à Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Erreur Gemini:", error);
      return NextResponse.json(
        { error: "Erreur lors de l'appel à Gemini" },
        { status: 500 }
      );
    }

    // 6. Extraire la réponse IA
    const data = await response.json();
    const aiText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Désolé, je ne peux pas répondre.";

    // 7. Créer le message IA
    const aiMessage: Message = {
      id: `msg-${Date.now()}`,
      userId: "ai",
      content: aiText.trim(),
      timestamp: Date.now(),
    };

    // 8. Ajouter le message IA à l’historique
    conversationHistory = [...conversationHistory, aiMessage].slice(
      -MAX_HISTORY
    );

    const responseData: ChatResponse = {
      message: aiMessage,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Erreur API:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * Construction du prompt LLM
 */
function buildPrompt(messages: Message[], users: any[]): string {
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  const usersList = users
    .filter((u) => u.role === "user")
    .map((u) => u.name)
    .join(", ");

  const history = messages
    .map((msg) => {
      const userName = userMap.get(msg.userId) || "Inconnu";
      return `${userName}: ${msg.content}`;
    })
    .join("\n");

  return `
Tu es un assistant IA participant à une conversation de groupe.

Participants : ${usersList}

Règles :
- Réponds naturellement comme dans un chat de groupe
- Participer de manière naturelle comme un vrai humain.
- Adresse les utilisateurs par leur nom si pertinent
- Tiens compte du contexte global
- Ne jamais inventer des informations qui n'ont pas été données.
- Réponds en français
- Sois concis

Historique :
${history}

Assistant :
`.trim();
}
