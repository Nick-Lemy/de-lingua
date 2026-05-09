"use client";

import { useState } from "react";
import { IoClose } from "react-icons/io5";
import { useTranslation } from "@/lib/i18n";
import type { PaymentProvider } from "@/lib/types";

const PHONE_RE = /^07\d{8}$/;

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
  const { t } = useTranslation();
  const [provider, setProvider] = useState<PaymentProvider>("mtn-momo");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState(defaultAmount);
  const [description, setDescription] = useState(productName);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [amountError, setAmountError] = useState("");

  if (!isOpen) return null;

  const validate = (): boolean => {
    let ok = true;

    const amountNum = Number(amount);
    if (!amount.trim() || !Number.isFinite(amountNum) || amountNum <= 0) {
      setAmountError(t("payment.amountInvalid"));
      ok = false;
    } else {
      setAmountError("");
    }

    if (!PHONE_RE.test(phone.trim())) {
      setPhoneError(t("payment.phoneInvalid"));
      ok = false;
    } else {
      setPhoneError("");
    }

    return ok;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({ provider, phone: phone.trim(), amount, description });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setAmount(defaultAmount);
        setDescription(productName);
        setPhone("");
        onClose();
      }, 2000);
    } catch (err) {
      console.error("PaymentModal submit failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-6 pt-3 pb-10 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {t("payment.requestPayment")}
            </h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <IoClose className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {success ? (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-bold text-lg text-gray-900">
                {t("payment.success")}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {provider === "mtn-momo"
                  ? t("payment.successMtn")
                  : t("payment.successAirtel")}
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {t("payment.amount")}
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl outline-none focus:border-[#1152A2] focus:ring-2 focus:ring-[#1152A2]/10 text-base font-medium transition-all"
                />
                {amountError && (
                  <p className="mt-1.5 text-sm text-red-500">{amountError}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {t("payment.description")}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("payment.descriptionPlaceholder")}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl outline-none focus:border-[#1152A2] focus:ring-2 focus:ring-[#1152A2]/10 text-base transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  {t("payment.provider")}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProvider("mtn-momo")}
                    className={`py-5 rounded-2xl font-bold text-base transition-all ${
                      provider === "mtn-momo"
                        ? "ring-2 ring-offset-2 ring-yellow-400 shadow-lg scale-[1.02]"
                        : "opacity-60 hover:opacity-80"
                    }`}
                    style={{ backgroundColor: "#FFCC00", color: "#000" }}
                  >
                    MTN MoMo
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider("airtel-money")}
                    className={`py-5 rounded-2xl font-bold text-base transition-all ${
                      provider === "airtel-money"
                        ? "ring-2 ring-offset-2 ring-red-500 shadow-lg scale-[1.02]"
                        : "opacity-60 hover:opacity-80"
                    }`}
                    style={{ backgroundColor: "#E40C0C", color: "#fff" }}
                  >
                    Airtel Money
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {t("payment.phone")}
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="07[0-9]{8}"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="078XXXXXXX"
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl outline-none focus:border-[#1152A2] focus:ring-2 focus:ring-[#1152A2]/10 text-base transition-all"
                />
                {phoneError && (
                  <p className="mt-1.5 text-sm text-red-500">{phoneError}</p>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-4 bg-[#1152A2] text-white rounded-2xl font-bold text-base shadow-lg shadow-blue-200/50 disabled:opacity-40 hover:bg-[#0d3f7a] transition-colors"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t("payment.sending")}
                  </span>
                ) : (
                  t("payment.send")
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
