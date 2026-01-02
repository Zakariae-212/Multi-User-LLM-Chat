"use client";

import { useState, useEffect, useRef } from "react";
import {
  User,
  Message,
  ChatUIState,
  ChatRequest,
  ChatResponse,
} from "./types/chat";

export default function ChatPage() {
  const initialUsers: User[] = [
    { id: "user-1", name: "Alice", role: "user" },
    { id: "user-2", name: "Bob", role: "user" },
    { id: "user-3", name: "Carol", role: "user" },
    { id: "ai", name: "Assistant", role: "ai" },
  ];

  const [state, setState] = useState<ChatUIState>({
    conversation: { messages: [], users: initialUsers },
    currentUserId: "user-1",
    isLoading: false,
  });

  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.conversation.messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      userId: state.currentUserId,
      content: inputText.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...state.conversation.messages, newMessage];

    setState((prev) => ({
      ...prev,
      conversation: { ...prev.conversation, messages: updatedMessages },
      isLoading: true,
    }));

    setInputText("");

    try {
      const requestBody: ChatRequest = {
        messages: updatedMessages,
        users: state.conversation.users,
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data: ChatResponse = await response.json();

      setState((prev) => ({
        ...prev,
        conversation: {
          ...prev.conversation,
          messages: [...prev.conversation.messages, data.message],
        },
        isLoading: false,
      }));
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
      alert("Erreur lors de l'envoi du message");
    }
  };
  

  const handleNewConversation = async () => {
  // Reset FRONTEND
  setState({
    conversation: { messages: [], users: initialUsers },
    currentUserId: "user-1",
    isLoading: false,
  });

  // Reset BACKEND
  await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [],
      users: initialUsers,
      reset: true,
    }),
  });
};


  const getUserName = (id: string) =>
    state.conversation.users.find((u) => u.id === id)?.name || "Inconnu";

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">💬 Chat Multi-Utilisateurs</h1>
        </div>
        <button
          onClick={handleNewConversation}
          className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm"
        >
          🔄 Nouvelle conversation
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {state.conversation.messages.map((msg) => {
          const isAI = msg.userId === "ai";
          return (
            <div key={msg.id} className="flex">
              <div
                className={`max-w-xl px-4 py-2 rounded-lg shadow ${
                  isAI
                    ? "bg-blue-500 text-white"
                    : "bg-white text-black border border-gray-300"
                }`}
              >
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold">
                    {getUserName(msg.userId)}
                  </span>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm">{msg.content}</div>
              </div>
            </div>
          );
        })}
        {state.isLoading && (
          <div className="text-gray-500">Assistant tape...</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white p-4 border-t">
        <div className="flex space-x-2 mb-2">
          <select
            value={state.currentUserId}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                currentUserId: e.target.value,
              }))
            }
            className="border px-2 py-1 rounded bg-white text-black"
          >
            {initialUsers
              .filter((u) => u.role === "user")
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
        </div>

        <div className="flex space-x-2">
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="
            flex-1 border px-3 py-2 rounded
            bg-white text-black
            placeholder:text-gray-500
            disabled:text-black
            disabled:bg-gray-100
            "
            placeholder="Tapez votre message..."
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
