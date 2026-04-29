"use client";

import { useState } from "react";
import { IoClose } from "react-icons/io5";
import type { PaymentProvider } from "@/lib/types";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    provider: PaymentProvider;
    phone: string;
    amount: string;
    description: string;
  }) => Promise<void>;
  defaultAmount?: string;
  productName?: string;
}

export function PaymentModal({
  isOpen,
  onClose,
  onSubmit,
  defaultAmount = "",
  productName = "",
}: PaymentModalProps) {
  const [provider, setProvider] = useState<PaymentProvider>("mtn-momo");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState(defaultAmount);
  const [description, setDescription] = useState(productName);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!amount.trim() || !phone.trim()) return;
    setSubmitting(true);
    try {
      // TODO: Wire real MTN MoMo / Airtel API call here
      await onSubmit({ provider, phone, amount, description });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setAmount(defaultAmount);
        setDescription(productName);
        setPhone("");
        onClose();
      }, 2000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl p-6 pb-10 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Request Payment</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <IoClose className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900">Payment request sent!</p>
            <p className="text-sm text-gray-500 mt-1">
              The other party will receive a {provider === "mtn-momo" ? "MTN MoMo" : "Airtel Money"} prompt.
            </p>
          </div>
        ) : (
          <>
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (RWF)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full px-4 py-3 border border-gray-200 rounded-md outline-none focus:border-[#1152A2] text-base"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 50 bags of rice"
                className="w-full px-4 py-3 border border-gray-200 rounded-md outline-none focus:border-[#1152A2] text-base"
              />
            </div>

            {/* Provider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProvider("mtn-momo")}
                  className={`py-4 rounded-xl font-bold text-sm transition-all border-2 ${
                    provider === "mtn-momo"
                      ? "border-[#FFCC00] shadow-md scale-[1.02]"
                      : "border-transparent opacity-70"
                  }`}
                  style={{ backgroundColor: "#FFCC00", color: "#000" }}
                >
                  MTN MoMo
                </button>
                <button
                  type="button"
                  onClick={() => setProvider("airtel-money")}
                  className={`py-4 rounded-xl font-bold text-sm transition-all border-2 ${
                    provider === "airtel-money"
                      ? "border-[#E40C0C] shadow-md scale-[1.02]"
                      : "border-transparent opacity-70"
                  }`}
                  style={{ backgroundColor: "#E40C0C", color: "#fff" }}
                >
                  Airtel Money
                </button>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 078XXXXXXX"
                className="w-full px-4 py-3 border border-gray-200 rounded-md outline-none focus:border-[#1152A2] text-base"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!amount.trim() || !phone.trim() || submitting}
              className="w-full py-4 bg-[#1152A2] text-white rounded-md font-semibold disabled:opacity-40 hover:bg-[#0d3f7a]"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </span>
              ) : (
                "Request Payment"
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
