"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  getUserProfile,
  getMissionById,
  getSellerById,
  getChatByMissionAndSeller,
  saveChatMessage,
} from "@/lib/storage";
import type { ChatMessage, Mission, Seller, UserProfile } from "@/lib/storage";

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mission, setMission] = useState<Mission | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sellerId = searchParams?.get("seller");

  useEffect(() => {
    setMounted(true);
    const profile = getUserProfile();
    if (!profile) {
      router.push("/welcome");
      return;
    }
    setUser(profile);

    const missionId = params?.id as string;
    if (!missionId || !sellerId) return;

    const foundMission = getMissionById(missionId);
    if (!foundMission) {
      router.push("/missions");
      return;
    }
    setMission(foundMission);

    const foundSeller = getSellerById(sellerId);
    if (!foundSeller) {
      router.push("/missions");
      return;
    }
    setSeller(foundSeller);

    const chat = getChatByMissionAndSeller(missionId, sellerId);
    setMessages(chat);
  }, [params, router, sellerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || !mission || !seller || !user) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      missionId: mission.id,
      sellerId: seller.id,
      sender: "buyer",
      text: newMessage.trim(),
      time: new Date().toISOString(),
    };

    saveChatMessage(message);
    setMessages([...messages, message]);
    setNewMessage("");

    // Simulate seller response after 2 seconds
    setTimeout(() => {
      const response: ChatMessage = {
        id: (Date.now() + 1).toString(),
        missionId: mission.id,
        sellerId: seller.id,
        sender: "seller",
        text: "Thank you for your message. We'll review your requirements and get back to you shortly.",
        time: new Date().toISOString(),
      };
      saveChatMessage(response);
      setMessages((prev) => [...prev, response]);
    }, 2000);
  };

  if (!mounted || !user || !mission || !seller) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-black text-white px-6 lg:px-8 pt-14 pb-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl font-bold">
              {seller.avatar}
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold">{seller.name}</h1>
              <p className="text-sm text-gray-400">Re: {mission.product}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Mission Context */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-center">
            <p className="text-xs text-gray-600 mb-2">Mission Details</p>
            <p className="font-semibold text-sm">{mission.product}</p>
            <p className="text-sm text-gray-600">
              {mission.quantity} units • €{mission.budgetMin}-€
              {mission.budgetMax} • {mission.location}
            </p>
          </div>

          {/* Messages */}
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 text-sm">Start the conversation</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "buyer" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.sender === "buyer"
                      ? "bg-black text-white"
                      : "bg-gray-100 text-black"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p
                    className={`text-xs mt-1 ${msg.sender === "buyer" ? "text-gray-400" : "text-gray-500"}`}
                  >
                    {new Date(msg.time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 lg:px-8 py-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-2xl focus:border-black focus:outline-none text-base"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-900 transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
