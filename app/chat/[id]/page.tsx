"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  getUserProfile,
  getMissionById,
  getSellerById,
  getChatByMissionAndSeller,
  saveChatMessage,
} from "@/lib/storage";
import {
  getMissionById as getFirebaseMission,
  getSellerById as getFirebaseSeller,
  getChatMessages,
  sendChatMessage as saveFirebaseMessage,
} from "@/lib/db";
import type { ChatMessage, Mission, Seller, UserProfile } from "@/lib/types";

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user: authUser, loading: authLoading } = useAuth();
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
  }, []);

  useEffect(() => {
    if (!mounted || authLoading) return;

    const loadData = async () => {
      const isConfigured = isFirebaseConfigured();
      const missionId = params?.id as string;
      if (!missionId || !sellerId) return;

      if (isConfigured) {
        if (!authUser) {
          router.push("/onboarding");
          return;
        }
        setUser(authUser);

        const foundMission = await getFirebaseMission(missionId);
        if (!foundMission) {
          router.push("/missions");
          return;
        }
        setMission(foundMission);

        const foundSeller = await getFirebaseSeller(sellerId);
        if (!foundSeller) {
          router.push("/missions");
          return;
        }
        setSeller(foundSeller);

        const chat = await getChatMessages(missionId, sellerId);
        setMessages(chat);
      } else {
        const profile = getUserProfile();
        if (!profile) {
          router.push("/onboarding");
          return;
        }
        setUser(profile);

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
      }
    };

    loadData();
  }, [mounted, authLoading, authUser, params, router, sellerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !mission || !seller || !user) return;

    const isConfigured = isFirebaseConfigured();
    const message: ChatMessage = {
      id: Date.now().toString(),
      missionId: mission.id,
      sellerId: seller.id,
      sender: "buyer",
      text: newMessage.trim(),
      time: new Date().toISOString(),
    };

    if (isConfigured) {
      await saveFirebaseMessage(message);
    } else {
      saveChatMessage(message);
    }
    setMessages([...messages, message]);
    setNewMessage("");

    // Simulate seller response after 2 seconds
    setTimeout(async () => {
      const response: ChatMessage = {
        id: (Date.now() + 1).toString(),
        missionId: mission.id,
        sellerId: seller.id,
        sender: "seller",
        text: "Thank you for your message. We'll review your requirements and get back to you shortly.",
        time: new Date().toISOString(),
      };
      if (isConfigured) {
        await saveFirebaseMessage(response);
      } else {
        saveChatMessage(response);
      }
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 text-white px-6 lg:px-8 pt-14 pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center"
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
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-xl font-bold">
              {seller.avatar}
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold">{seller.name}</h1>
              <p className="text-sm text-slate-300">Re: {mission.product}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Mission Context */}
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 text-center">
            <p className="text-xs text-slate-600 mb-2 font-medium">
              Mission Details
            </p>
            <p className="font-semibold text-sm text-slate-800">
              {mission.product}
            </p>
            <p className="text-sm text-slate-600">
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
                      ? "bg-slate-800 text-white"
                      : "bg-white border border-gray-200 text-black"
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
            className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
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
