"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  getUserProfile,
  getSellerById,
  saveSeller,
  createSellerFromUser,
} from "@/lib/storage";
import {
  getSellerById as getFirebaseSeller,
  updateSellerInventory,
} from "@/lib/db";
import type { UserProfile, Seller, InventoryItem } from "@/lib/types";
import { BottomNav } from "@/components/BottomNav";
import { IoArrowBack, IoAdd, IoTrash, IoSave, IoClose } from "react-icons/io5";
import { useTranslation } from "@/lib/i18n";

export default function InventoryPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user: authUser, isConfigured, loading } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Form state for new/edit item
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    moq: "",
    leadTime: "",
    image: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;

    const loadData = async () => {
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

      if (currentUser.role !== "seller") {
        router.push("/");
        return;
      }

      setUser(currentUser);

      // Load seller data
      let sellerData: Seller | null = null;
      if (isConfigured) {
        sellerData = await getFirebaseSeller(currentUser.id);
      } else {
        sellerData = getSellerById(currentUser.id);
      }

      // If no seller profile exists, create one
      if (!sellerData) {
        sellerData = createSellerFromUser(currentUser);
      }

      setSeller(sellerData);
      setInventory(sellerData.inventory || []);
    };

    loadData();
  }, [mounted, loading, authUser, isConfigured, router]);

  const handleAddItem = () => {
    setFormData({
      name: "",
      price: "",
      stock: "",
      moq: "",
      leadTime: "",
      image: "",
    });
    setEditingItem(null);
    setShowAddModal(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setFormData({
      name: item.name,
      price: item.price,
      stock: item.stock.toString(),
      moq: item.moq,
      leadTime: item.leadTime,
      image: item.image || "",
    });
    setEditingItem(item);
    setShowAddModal(true);
  };

  const handleDeleteItem = (itemId: string) => {
    setInventory(inventory.filter((item) => item.id !== itemId));
    setIsEditing(true);
  };

  const handleSaveItem = () => {
    if (!formData.name.trim() || !formData.price.trim()) return;

    const newItem: InventoryItem = {
      id: editingItem?.id || `inv_${Date.now()}`,
      name: formData.name,
      price: formData.price,
      stock: parseInt(formData.stock) || 0,
      moq: formData.moq || "1 unit",
      leadTime: formData.leadTime || "1-2 weeks",
      image: formData.image || undefined,
    };

    if (editingItem) {
      setInventory(
        inventory.map((item) => (item.id === editingItem.id ? newItem : item)),
      );
    } else {
      setInventory([...inventory, newItem]);
    }

    setShowAddModal(false);
    setIsEditing(true);
  };

  const handleSaveInventory = async () => {
    if (!seller) return;

    setSaving(true);
    try {
      if (isConfigured) {
        await updateSellerInventory(seller.id, inventory);
      } else {
        const updatedSeller = { ...seller, inventory };
        saveSeller(updatedSeller);
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving inventory:", error);
    }
    setSaving(false);
  };

  if (!mounted || loading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1152A2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Header */}
      <div className="bg-[#1152A2] text-white px-5 pt-12 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-md bg-white/20 flex items-center justify-center"
            >
              <IoArrowBack className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{t("inventory.title")}</h1>
              <p className="text-slate-300 text-sm">
                {t("inventory.manage")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 max-w-lg mx-auto mt-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-md p-3 border border-gray-200">
            <p className="text-gray-500 text-xs mb-1">Products</p>
            <p className="text-lg font-bold text-[#1152A2]">
              {inventory.length}
            </p>
          </div>
          <div className="bg-white rounded-md p-3 border border-gray-200">
            <p className="text-gray-500 text-xs mb-1">In Stock</p>
            <p className="text-lg font-bold text-[#1152A2]">
              {inventory.filter((i) => i.stock > 0).length}
            </p>
          </div>
          <div className="bg-white rounded-md p-3 border border-gray-200">
            <p className="text-gray-500 text-xs mb-1">Low Stock</p>
            <p className="text-lg font-bold text-[#EF7C29]">
              {inventory.filter((i) => i.stock > 0 && i.stock < 10).length}
            </p>
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={handleAddItem}
          className="w-full bg-[#EF7C29] text-white rounded-md p-4 flex items-center justify-center gap-2 mb-5 hover:bg-[#d96a1f]"
        >
          <IoAdd className="w-5 h-5" />
          {t("inventory.addNewProduct")}
        </button>

        {/* Inventory List */}
        <div className="space-y-3">
          {inventory.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-md border border-gray-200">
              <p className="text-gray-500">No products in inventory</p>
              <p className="text-sm text-gray-400 mt-1">
                {t("inventory.addFirstProduct")}
              </p>
            </div>
          ) : (
            inventory.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-md p-4 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex gap-3 items-center">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 object-cover rounded-md border border-gray-200"
                      />
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {item.name}
                      </h4>
                      <p className="text-[#EF7C29] font-bold">
                        {item.price} RWF
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditItem(item)}
                      className="p-2 text-slate-600 hover:bg-gray-100 rounded-lg"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <IoTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span
                    className={`${
                      item.stock === 0
                        ? "text-red-500"
                        : item.stock < 10
                          ? "text-[#EF7C29]"
                          : "text-[#1152A2]"
                    }`}
                  >
                    Stock: {item.stock}
                  </span>
                  <span>MOQ: {item.moq}</span>
                  <span>Lead: {item.leadTime}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Save Button */}
        {isEditing && (
          <div className="fixed bottom-24 left-0 right-0 px-5">
            <div className="max-w-lg mx-auto">
              <button
                onClick={handleSaveInventory}
                disabled={saving}
                className="w-full bg-[#1152A2] text-white rounded-md py-4 flex items-center justify-center gap-2 hover:bg-[#0d3f7a]"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <IoSave className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 pb-32 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">
                {editingItem ? t("inventory.editProduct") : t("inventory.addProduct")}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <IoClose className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder={t("inventory.namePlaceholder")}
                  className="w-full px-4 py-3 border border-gray-200 rounded-md outline-none focus:border-slate-800"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Image (optional)
                </label>
                {formData.image && (
                  <div className="mb-2">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-md border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: "" })}
                      className="ml-2 text-xs text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) {
                      alert("Image too large (max 2MB)");
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      setFormData((prev) => ({
                        ...prev,
                        image: event.target?.result as string,
                      }));
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (RWF) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder={t("inventory.priceExample")}
                    className="w-full px-4 py-3 border border-gray-200 rounded-md outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    placeholder={t("inventory.stockPlaceholder")}
                    className="w-full px-4 py-3 border border-gray-200 rounded-md outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Order Qty
                  </label>
                  <input
                    type="text"
                    value={formData.moq}
                    onChange={(e) =>
                      setFormData({ ...formData, moq: e.target.value })
                    }
                    placeholder={t("inventory.moqPlaceholder")}
                    className="w-full px-4 py-3 border border-gray-200 rounded-md outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lead Time
                  </label>
                  <input
                    type="text"
                    value={formData.leadTime}
                    onChange={(e) =>
                      setFormData({ ...formData, leadTime: e.target.value })
                    }
                    placeholder={t("inventory.leadTimePlaceholder")}
                    className="w-full px-4 py-3 border border-gray-200 rounded-md outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveItem}
                disabled={!formData.name.trim() || !formData.price.trim()}
                className="w-full bg-[#EF7C29] text-white py-4 rounded-md font-semibold mt-6 disabled:opacity-50 hover:bg-[#d96a1f]"
                style={{
                  position: "fixed",
                  left: 0,
                  right: 0,
                  bottom: "72px",
                  maxWidth: "28rem",
                  margin: "0 auto",
                }}
              >
                {editingItem ? t("inventory.updateProduct") : t("inventory.addProduct")}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav role="seller" />
    </div>
  );
}
