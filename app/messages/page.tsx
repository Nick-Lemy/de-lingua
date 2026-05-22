"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import {
  getUserProfile,
  getChatsForBuyer,
  getChatsForSeller,
  getMissionById,
  getSellerById,
} from "@/lib/storage";
import {
  getChatsForBuyer as getFirebaseChatsForBuyer,
  getChatsForSeller as getFirebaseChatsForSeller,
  getMissionById as getFirebaseMission,
  getSellerById as getFirebaseSeller,
  getUserById,
} from "@/lib/db";
import type { UserProfile, ChatMessage, Mission, Seller } from "@/lib/types";
import { BottomNav } from "@/components/BottomNav";
import { IoArrowBack, IoChatbubbles, IoTime } from "react-icons/io5";
import { useTranslation } from "@/lib/i18n";

interface Conversation {
  missionId: string;
  sellerId: string;
  buyerId: string;
  mission?: Mission;
  seller?: Seller;
  buyer?: UserProfile;
  lastMessage: ChatMessage;
  unreadCount: number;
}

export default function MessagesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user: authUser, isConfigured, loading } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);

  useEffect(() => {
    // Use requestAnimationFrame to avoid cascading renders
    requestAnimationFrame(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;

    const loadData = async () => {
      setLoadingChats(true);
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

      // Load chats based on user role
      let messages: ChatMessage[] = [];
      if (isConfigured) {
        if (currentUser.role === "buyer") {
          messages = await getFirebaseChatsForBuyer(currentUser.id);
        } else {
          messages = await getFirebaseChatsForSeller(currentUser.id);
        }
      } else {
        if (currentUser.role === "buyer") {
          messages = getChatsForBuyer(currentUser.id);
        } else {
          messages = getChatsForSeller(currentUser.id);
        }
      }

      // Group messages by conversation (missionId + sellerId)
      const conversationMap = new Map<string, ChatMessage[]>();
      messages.forEach((msg) => {
        const key = `${msg.missionId}|||${msg.sellerId}`;
        if (!conversationMap.has(key)) {
          conversationMap.set(key, []);
        }
        conversationMap.get(key)!.push(msg);
      });

      // Build conversation list
      const convList: Conversation[] = [];

      for (const [key, msgs] of conversationMap) {
        const sepIdx = key.indexOf("|||");
        const missionId = key.slice(0, sepIdx);
        const sellerId = key.slice(sepIdx + 3);
        const sortedMsgs = msgs.sort(
          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
        );
        const lastMessage = sortedMsgs[0];

        // Load mission info
        let mission: Mission | null = null;
        if (isConfigured) {
          mission = await getFirebaseMission(missionId);
        } else {
          mission = getMissionById(missionId);
        }

        // Load seller info
        let seller: Seller | null = null;
        if (isConfigured) {
          seller = await getFirebaseSeller(sellerId);
        } else {
          seller = getSellerById(sellerId);
        }

        // Load buyer info (for sellers)
        let buyer: UserProfile | null = null;
        if (currentUser.role === "seller" && lastMessage.buyerId) {
          if (isConfigured) {
            buyer = await getUserById(lastMessage.buyerId);
          }
        }

        convList.push({
          missionId,
          sellerId,
          buyerId: lastMessage.buyerId,
          mission: mission || undefined,
          seller: seller || undefined,
          buyer: buyer || undefined,
          lastMessage,
          unreadCount: 0, // TODO: Implement unread count
        });
      }

      // Sort by last message time
      convList.sort(
        (a, b) =>
          new Date(b.lastMessage.time).getTime() -
          new Date(a.lastMessage.time).getTime(),
      );

      setConversations(convList);
    };
    loadData().finally(() => setLoadingChats(false));
  }, [mounted, loading, authUser, isConfigured, router]);

  const formatTime = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 48) {
      return t("time.yesterday");
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
    }
  };

  if (!mounted || loading || !user) {
    return (
      <div className="min-h-screen bg-[#f8faff] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#1152A2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isBuyer = user.role === "buyer";

  return (
    <div className="min-h-screen bg-[#f8faff] pb-28">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1152A2] via-[#1a6bc9] to-[#0d3d7a] text-white px-5 pt-14 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center"
            >
              <IoArrowBack className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{t("messages.title")}</h1>
              <p className="text-blue-200 text-sm">
                {t("messages.conversationsCount", { count: conversations.length })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 max-w-lg mx-auto mt-4">
        <div className="space-y-3">
          {loadingChats ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-8 h-8 border-2 border-[#1152A2] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500 font-medium">{t("messages.loading")}</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                <IoChatbubbles className="w-8 h-8 text-[#1152A2]/40" />
              </div>
              <p className="font-semibold text-gray-600">{t("messages.noConversations")}</p>
              <p className="text-sm text-gray-400 mt-1 px-8">
                {isBuyer ? t("messages.startConversationBuyer") : t("messages.conversationsAppear")}
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const partnerName = isBuyer
                ? conv.seller?.name || "Seller"
                : conv.buyer?.name || "Buyer";
              const partnerAvatar = isBuyer
                ? conv.seller?.avatar || "S"
                : conv.buyer?.avatar || conv.buyer?.name?.charAt(0).toUpperCase() || "B";

              return (
                <Link
                  key={`${conv.lastMessage.missionId}_${conv.lastMessage.sellerId}`}
                  href={`/chat/${conv.lastMessage.missionId}?seller=${conv.lastMessage.sellerId}`}
                  className="block bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#1152A2]/20 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#1152A2] to-[#1a6bc9] text-white flex items-center justify-center text-lg font-bold shrink-0 shadow-sm">
                      {partnerAvatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="font-bold text-gray-900 truncate">{partnerName}</h4>
                        <span className="text-xs text-gray-400 shrink-0 ml-2">
                          {formatTime(conv.lastMessage.time)}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-[#1152A2] mb-1 truncate">
                        {t("messages.re")} {conv.mission?.product || t("messages.mission")}
                      </p>
                      <p className="text-sm text-gray-400 truncate">
                        {conv.lastMessage.sender === user.role ? t("messages.you") + " " : ""}
                        {conv.lastMessage.text}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      <BottomNav role={user.role} />
    </div>
  );
}
