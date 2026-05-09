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
  hasReviewedSeller,
  getPaymentsByChat as getLocalPayments,
  savePaymentRequest,
  updatePaymentStatus as updateLocalPaymentStatus,
  generateId,
} from "@/lib/storage";
import {
  getMissionById as getFirebaseMission,
  getSellerById as getFirebaseSeller,
  getChatMessages,
  sendChatMessage as saveFirebaseMessage,
  getUserById,
  hasReviewedSeller as firebaseHasReviewed,
  getPaymentsByChat as getFirebasePayments,
  createPaymentRequest,
  updatePaymentStatus as updateFirebasePaymentStatus,
} from "@/lib/db";
import type {
  ChatMessage,
  Mission,
  Seller,
  UserProfile,
  PaymentRequest,
  PaymentProvider,
} from "@/lib/types";
import { PaymentModal } from "@/components/PaymentModal";
import { IoArrowBack, IoSend, IoCardOutline } from "react-icons/io5";
import { useTranslation } from "@/lib/i18n";
import { translateText } from "@/lib/translate";

export default function ChatPage() {
  const router = useRouter();
  const { t, lang } = useTranslation();
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
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [translationErrors, setTranslationErrors] = useState<Record<string, boolean>>({});
  const [showPayment, setShowPayment] = useState(false);
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sellerId = searchParams?.get("seller");

  const isBuyer = user?.role === "buyer";
  const partnerName = isBuyer
    ? seller?.name || t("chat.seller")
    : buyer?.name || t("chat.buyer");
  const partnerAvatar = isBuyer
    ? seller?.avatar || (seller?.name?.charAt(0).toUpperCase() ?? "S")
    : buyer?.avatar || (buyer?.name?.charAt(0).toUpperCase() ?? "B");

  useEffect(() => {
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

      let foundMission: Mission | null = null;
      if (isConfigured) {
        foundMission = await getFirebaseMission(missionId);
      } else {
        foundMission = getMissionById(missionId);
      }

      if (!foundMission) {
        router.push(currentUser.role === "buyer" ? "/missions" : "/seller-dashboard");
        return;
      }
      setMission(foundMission);

      let foundSeller: Seller | null = null;
      if (isConfigured) {
        foundSeller = await getFirebaseSeller(sellerId);
      } else {
        foundSeller = getSellerById(sellerId);
      }

      if (!foundSeller) {
        router.push(currentUser.role === "buyer" ? "/missions" : "/seller-dashboard");
        return;
      }
      setSeller(foundSeller);

      if (currentUser.role === "seller" && isConfigured) {
        const buyerProfile = await getUserById(foundMission.buyerId);
        setBuyer(buyerProfile);
      } else if (currentUser.role === "seller") {
        setBuyer({
          id: foundMission.buyerId,
          name: t("chat.buyer"),
          email: "",
          role: "buyer",
          avatar: "B",
        });
      }

      // Load messages and payments concurrently
      const [chatResult, paymentsResult] = await Promise.all([
        isConfigured
          ? getChatMessages(missionId, sellerId)
          : Promise.resolve(getChatByMissionAndSeller(missionId, sellerId)),
        isConfigured
          ? getFirebasePayments(missionId, sellerId)
          : Promise.resolve(getLocalPayments(missionId, sellerId)),
      ]);

      setMessages(chatResult);
      setPayments(paymentsResult);

      // Check if buyer has already reviewed this seller
      if (currentUser.role === "buyer") {
        const reviewed = isConfigured
          ? await firebaseHasReviewed(currentUser.id, sellerId, missionId)
          : hasReviewedSeller(currentUser.id, sellerId, missionId);
        setAlreadyReviewed(reviewed);
      }
    };

    loadData();
  }, [mounted, authLoading, authUser, params, router, sellerId, t]);

  // Poll for new messages — first poll immediately, then every 3s
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

    // Call immediately, don't wait 3s for first load
    poll();

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
    if (!mission.id || mission.id === "mission") {
      alert(t("chat.invalidMission"));
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
      type: "text",
    };

    try {
      if (isConfigured) {
        await saveFirebaseMessage(message);
      } else {
        saveChatMessage(message);
      }
      setNewMessage("");
      await loadMessages();
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleTranslate = async (msg: ChatMessage) => {
    if (translations[msg.id]) {
      setShowOriginal((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }));
      return;
    }

    setTranslatingId(msg.id);
    try {
      const tr = await translateText(msg.text, lang);
      setTranslations((prev) => ({ ...prev, [msg.id]: tr }));
      setShowOriginal((prev) => ({ ...prev, [msg.id]: false }));
    } catch (err) {
      console.error("translation error", err);
      setTranslationErrors((prev) => ({ ...prev, [msg.id]: true }));
    } finally {
      setTranslatingId(null);
    }
  };

  const handlePaymentSubmit = async (data: {
    provider: PaymentProvider;
    phone: string;
    amount: string;
    description: string;
  }) => {
    if (!mission || !seller || !user) return;
    const isConfigured = isFirebaseConfigured();

    const paymentId = generateId("pay");
    const payment: PaymentRequest = {
      id: paymentId,
      missionId: mission.id,
      sellerId: seller.id,
      buyerId: mission.buyerId,
      amount: parseFloat(data.amount),
      currency: "RWF",
      provider: data.provider,
      phoneNumber: data.phone,
      description: data.description,
      status: "initiated",
      requestedBy: user.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const paymentMsg: ChatMessage = {
      id: generateId("msg"),
      missionId: mission.id,
      sellerId: seller.id,
      buyerId: mission.buyerId,
      sender: user.role,
      text: `Payment request: RWF ${data.amount} via ${data.provider === "mtn-momo" ? "MTN MoMo" : "Airtel Money"}`,
      time: new Date().toISOString(),
      type: "payment-request",
      paymentRequestId: paymentId,
    };

    if (isConfigured) {
      await createPaymentRequest(payment);
      await saveFirebaseMessage(paymentMsg);
    } else {
      savePaymentRequest(payment);
      saveChatMessage(paymentMsg);
    }

    setPayments((prev) => [...prev, payment]);
    await loadMessages();
  };

  const handleConfirmPayment = async (paymentRequestId: string) => {
    if (!mission || !seller || !user) return;
    const isConfigured = isFirebaseConfigured();

    if (isConfigured) {
      await updateFirebasePaymentStatus(paymentRequestId, "confirmed");
    } else {
      updateLocalPaymentStatus(paymentRequestId, "confirmed");
    }

    setPayments((prev) =>
      prev.map((p) => (p.id === paymentRequestId ? { ...p, status: "confirmed" } : p)),
    );

    const confirmMsg: ChatMessage = {
      id: generateId("msg"),
      missionId: mission.id,
      sellerId: seller.id,
      buyerId: mission.buyerId,
      sender: user.role,
      text: "Payment confirmed ✓",
      time: new Date().toISOString(),
      type: "payment-confirmed",
    };

    if (isConfigured) {
      await saveFirebaseMessage(confirmMsg);
    } else {
      saveChatMessage(confirmMsg);
    }

    await loadMessages();
  };

  const getPaymentForMsg = (paymentRequestId: string) =>
    payments.find((p) => p.id === paymentRequestId);

  if (!mounted || !user || !mission || !seller) {
    return (
      <div className="min-h-screen bg-[#f8faff] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#1152A2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const showReviewBanner =
    isBuyer && messages.length >= 3 && !alreadyReviewed;

  return (
    <div className="min-h-screen bg-[#f8faff] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1152A2] via-[#1a6bc9] to-[#0d3d7a] text-white px-5 pt-14 pb-5 shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center shrink-0"
            >
              <IoArrowBack className="w-5 h-5" />
            </button>
            <div className="w-11 h-11 rounded-xl bg-[#EF7C29] flex items-center justify-center text-lg font-bold shrink-0 shadow-md">
              {partnerAvatar}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold truncate">{partnerName}</h1>
              <p className="text-xs text-blue-200 truncate">{t("chat.re")} {mission.product}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Mission Context pill */}
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl px-4 py-3 text-center mx-4">
            <p className="text-xs text-gray-400 font-medium mb-0.5">
              {t("chat.missionDetailsHeader")}
            </p>
            <p className="font-semibold text-sm text-gray-800">{mission.product}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {mission.quantity} {t("chat.units")} · RWF {mission.budgetMin}–{mission.budgetMax} · {mission.location}
            </p>
          </div>

          {/* Messages */}
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">{partnerAvatar}</span>
              </div>
              <p className="text-sm font-medium text-gray-500">
                {isBuyer ? t("chat.startConversationSeller") : t("chat.waitForBuyer")}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.sender === user.role;

              // Payment request card
              if (msg.type === "payment-request" && msg.paymentRequestId) {
                const payment = getPaymentForMsg(msg.paymentRequestId);
                const isReceiver = msg.sender !== user.role;
                return (
                  <div key={msg.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[80%] bg-white border border-[#1152A2]/20 rounded-2xl p-4 shadow-sm space-y-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#1152A2]/10 flex items-center justify-center">
                          <IoCardOutline className="w-4 h-4 text-[#1152A2]" />
                        </div>
                        <span className="font-bold text-sm text-gray-900">Payment Request</span>
                      </div>
                      <p className="text-2xl font-bold text-[#1152A2]">
                        RWF {payment?.amount?.toLocaleString() || "—"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {payment?.provider === "mtn-momo" ? "MTN MoMo" : "Airtel Money"}
                        {payment?.description ? ` · ${payment.description}` : ""}
                      </p>
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          payment?.status === "confirmed"
                            ? "bg-green-50 text-green-700"
                            : payment?.status === "failed"
                            ? "bg-red-50 text-red-600"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {payment?.status === "confirmed"
                          ? "✓ Confirmed"
                          : payment?.status === "failed"
                          ? "Failed"
                          : "⏳ Pending"}
                      </span>
                      {isReceiver && payment?.status === "initiated" && (
                        <button
                          onClick={() => handleConfirmPayment(msg.paymentRequestId!)}
                          className="w-full py-2.5 mt-1 bg-[#1152A2] text-white text-sm rounded-xl font-semibold hover:bg-[#0d3d7a] transition-colors"
                        >
                          Confirm Receipt
                        </button>
                      )}
                      <p className="text-xs text-gray-400">
                        {new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                      isOwnMessage
                        ? msg.type === "payment-confirmed"
                          ? "bg-green-500 text-white"
                          : "bg-[#1152A2] text-white"
                        : "bg-white border border-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    {translations[msg.id] && !showOriginal[msg.id] && (
                      <p className={`text-xs italic mt-1.5 ${isOwnMessage ? "text-blue-200" : "text-gray-400"}`}>
                        {translations[msg.id]}
                      </p>
                    )}
                    {translationErrors[msg.id] && (
                      <p className="text-xs text-red-300 mt-1">{t("chat.translationError")}</p>
                    )}
                    {msg.type !== "payment-confirmed" && (
                      <button
                        onClick={() => handleTranslate(msg)}
                        className={`text-xs mt-1.5 hover:underline ${isOwnMessage ? "text-blue-300" : "text-gray-400"}`}
                      >
                        {translatingId === msg.id
                          ? t("chat.translating")
                          : translations[msg.id]
                          ? showOriginal[msg.id]
                            ? t("chat.showOriginal")
                            : t("chat.hideTranslation")
                          : t("chat.translate")}
                      </button>
                    )}
                    <p className={`text-[11px] mt-1 ${isOwnMessage ? "text-blue-300" : "text-gray-400"}`}>
                      {new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Review banner */}
      {showReviewBanner && (
        <div className="bg-amber-50 border-t border-amber-100 px-4 py-3 shrink-0">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <p className="text-sm text-amber-800 font-semibold">
              Rate your experience with {seller.name}
            </p>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() =>
                    router.push(
                      `/reviews/${seller.id}?mission=${mission.id}&initialRating=${star}`,
                    )
                  }
                  className="text-amber-300 hover:text-amber-500 text-xl transition-colors hover:scale-125"
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-3 shrink-0 safe-area-pb">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          {/* Payment button */}
          <button
            onClick={() => setShowPayment(true)}
            className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-200 text-[#1152A2] flex items-center justify-center hover:bg-[#1152A2]/5 transition-colors shrink-0"
            title="Request Payment"
          >
            <IoCardOutline className="w-5 h-5" />
          </button>

          <input
            type="text"
            placeholder={t("chat.input.placeholder")}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#1152A2] focus:bg-white focus:ring-2 focus:ring-[#1152A2]/10 outline-none text-sm transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="w-11 h-11 rounded-xl bg-[#EF7C29] text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#e06c1e] transition-colors shadow-md shadow-orange-200/50 shrink-0"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <IoSend className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onSubmit={handlePaymentSubmit}
        productName={mission.product}
      />
    </div>
  );
}
