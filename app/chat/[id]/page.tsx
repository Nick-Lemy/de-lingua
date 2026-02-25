"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  getUserById,
} from "@/lib/db";
import type { ChatMessage, Mission, Seller, UserProfile } from "@/lib/types";
import { IoArrowBack, IoSend } from "react-icons/io5";

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mission, setMission] = useState<Mission | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [buyer, setBuyer] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sellerId = searchParams?.get("seller");

  // Determine if current user is buyer or seller in this conversation
  const isBuyer = user?.role === "buyer";
  // Robust partner name/avatar logic
  const partnerName = isBuyer
    ? seller?.name || "Seller"
    : buyer?.name || "Buyer";
  const partnerAvatar = isBuyer
    ? seller?.avatar || (seller?.name?.charAt(0).toUpperCase() ?? "S")
    : buyer?.avatar || (buyer?.name?.charAt(0).toUpperCase() ?? "B");

  useEffect(() => {
    // Use requestAnimationFrame to avoid cascading renders
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const loadMessages = useCallback(async () => {
    if (!mission || !sellerId) return;

    const isConfigured = isFirebaseConfigured();
    let chat: ChatMessage[] = [];

    if (isConfigured) {
      chat = await getChatMessages(mission.id, sellerId);
    } else {
      chat = getChatByMissionAndSeller(mission.id, sellerId);
    }

    setMessages(chat);
  }, [mission, sellerId]);

  useEffect(() => {
    if (!mounted || authLoading) return;

    const loadData = async () => {
      const isConfigured = isFirebaseConfigured();
      const missionId = params?.id as string;
      if (!missionId || !sellerId) return;

      let currentUser: UserProfile | null = null;

      if (isConfigured) {
        if (!authUser) {
          router.push("/onboarding");
          return;
        }
        currentUser = authUser;
      } else {
        currentUser = getUserProfile();
        if (!currentUser) {
          router.push("/onboarding");
          return;
        }
      }

      setUser(currentUser);

      // Load mission
      let foundMission: Mission | null = null;
      if (isConfigured) {
        foundMission = await getFirebaseMission(missionId);
      } else {
        foundMission = getMissionById(missionId);
      }

      if (!foundMission) {
        router.push(
          currentUser.role === "buyer" ? "/missions" : "/seller-dashboard",
        );
        return;
      }
      setMission(foundMission);

      // Load seller
      let foundSeller: Seller | null = null;
      if (isConfigured) {
        foundSeller = await getFirebaseSeller(sellerId);
      } else {
        foundSeller = getSellerById(sellerId);
      }

      if (!foundSeller) {
        router.push(
          currentUser.role === "buyer" ? "/missions" : "/seller-dashboard",
        );
        return;
      }
      setSeller(foundSeller);

      // Load buyer info (for seller view)
      if (currentUser.role === "seller" && isConfigured) {
        const buyerProfile = await getUserById(foundMission.buyerId);
        setBuyer(buyerProfile);
      } else if (currentUser.role === "seller") {
        // For local storage, we create a placeholder buyer
        setBuyer({
          id: foundMission.buyerId,
          name: "Buyer",
          email: "",
          role: "buyer",
          avatar: "B",
        });
      }

      // Load messages
      let chat: ChatMessage[] = [];
      if (isConfigured) {
        chat = await getChatMessages(missionId, sellerId);
      } else {
        chat = getChatByMissionAndSeller(missionId, sellerId);
      }
      setMessages(chat);
    };

    loadData();
  }, [mounted, authLoading, authUser, params, router, sellerId]);

  // Poll for new messages every 3 seconds using setTimeout for better control
  useEffect(() => {
    if (!mission || !sellerId) return;

    let isMounted = true;
    let pollTimeout: NodeJS.Timeout;
    const poll = async () => {
      await loadMessages();
      if (isMounted) {
        pollTimeout = setTimeout(poll, 3000);
      }
    };
    pollTimeout = setTimeout(poll, 3000);

    return () => {
      isMounted = false;
      clearTimeout(pollTimeout);
    };
  }, [mission, sellerId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !mission || !seller || !user || isSending) return;
    // Prevent sending messages with invalid missionId
    if (!mission.id || mission.id === "mission") {
      alert("Invalid mission. Cannot send message.");
      return;
    }

    setIsSending(true);
    const isConfigured = isFirebaseConfigured();

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      missionId: mission.id,
      sellerId: seller.id,
      buyerId: mission.buyerId,
      sender: user.role,
      text: newMessage.trim(),
      time: new Date().toISOString(),
    };

    try {
      if (isConfigured) {
        await saveFirebaseMessage(message);
      } else {
        saveChatMessage(message);
      }
      setNewMessage("");
      await loadMessages(); // Always reload from source to avoid duplicates
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Defensive checks for mission, seller, user before rendering chat UI
  if (!mounted || !user || !mission || !seller) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-[#1152A2] text-white px-6 lg:px-8 pt-14 pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-md bg-white/10 border border-white/20 flex items-center justify-center"
            >
              <IoArrowBack className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-md bg-[#EF7C29] flex items-center justify-center text-xl font-bold">
              {partnerAvatar}
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold">{partnerName}</h1>
              <p className="text-sm text-slate-300">Re: {mission.product}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Mission Context */}
          <div className="bg-slate-100 border border-slate-200 rounded-md p-4 text-center">
            <p className="text-xs text-slate-600 mb-2 font-medium">
              Mission Details
            </p>
            <p className="font-semibold text-sm text-slate-800">
              {mission.product}
            </p>
            <p className="text-sm text-slate-600">
              {mission.quantity} units • RWF{mission.budgetMin}-RWF
              {mission.budgetMax} • {mission.location}
            </p>
          </div>

          {/* Messages */}
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 text-sm">
                {isBuyer
                  ? "Start the conversation with the seller"
                  : "Wait for the buyer to start the conversation or send a message"}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.sender === user.role;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-md px-4 py-3 ${
                      isOwnMessage
                        ? "bg-[#1152A2] text-white"
                        : "bg-white border border-gray-200 text-black"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p
                      className={`text-xs mt-1 ${isOwnMessage ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {new Date(msg.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 lg:px-8 py-4 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-md focus:border-[#1152A2] focus:outline-none text-base"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="w-12 h-12 rounded-md bg-[#EF7C29] text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#d96a1f]"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <IoSend className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
