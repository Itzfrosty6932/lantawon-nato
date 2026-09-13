"use client";

import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Laptop,
  LogOut,
  AlertCircle,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getUserDevices, revokeDevice } from "@/lib/services/device-service";
import { useToast } from "@/components/ui/Toast";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

interface Device {
  id: string;
  device_name: string;
  browser?: string;
  os?: string;
  ip_address?: string;
  is_active: boolean;
  last_active_at: string;
  created_at: string;
}

export default function DevicesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [deviceToRevoke, setDeviceToRevoke] = useState<string | null>(null);

  useEffect(() => {
    if (!user.isLoggedIn) {
      router.push("/login");
      return;
    }

    loadDevices();
  }, [user, router]);

  const loadDevices = async () => {
    setLoading(true);
    const devs = await getUserDevices();
    setDevices(devs || []);
    setLoading(false);
  };

  const handleRevokeDevice = async (deviceId: string) => {
    setDeviceToRevoke(null);
    setRevoking(deviceId);
    const success = await revokeDevice(deviceId);

    if (success) {
      showToast("Device removed successfully", "success");
      await loadDevices();
    } else {
      showToast("Failed to remove device", "error");
    }
    setRevoking(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDeviceIcon = (osName?: string) => {
    if (osName?.includes("Windows") || osName?.includes("Linux"))
      return <Laptop className="w-6 h-6" />;
    if (osName?.includes("iOS") || osName?.includes("Android"))
      return <Smartphone className="w-6 h-6" />;
    return <Laptop className="w-6 h-6" />;
  };

  if (!user.isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-black text-white p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Active Devices</h1>
          <p className="text-neutral-400">
            Manage devices logged into your account. Remove any that you don't
            recognize.
          </p>
        </div>

        {/* Security Alert */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-8 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-300">Security Reminder</p>
            <p className="text-sm text-red-200/70 mt-1">
              If you see a device you don't recognize, remove it immediately
              and change your password.
            </p>
          </div>
        </div>

        {/* Devices List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#E50914]" />
            </div>
          ) : devices.length === 0 ? (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-8 text-center">
              <p className="text-neutral-400">No devices found</p>
            </div>
          ) : (
            devices.map((device) => (
              <div
                key={device.id}
                className={`bg-neutral-900/50 border rounded-lg p-4 transition ${
                  device.is_active
                    ? "border-neutral-800 hover:border-neutral-700"
                    : "border-neutral-800/50 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Device Icon */}
                    <div className="text-neutral-400 flex-shrink-0 mt-1">
                      {getDeviceIcon(device.os)}
                    </div>

                    {/* Device Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate">
                          {device.device_name}
                        </h3>
                        {device.is_active ? (
                          <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded">
                            <Check className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-neutral-700/50 text-neutral-400 text-xs px-2 py-1 rounded">
                            <X className="w-3 h-3" />
                            Removed
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-neutral-400 space-y-0.5">
                        {device.ip_address && device.ip_address !== "Unknown" && (
                          <p>IP: {device.ip_address}</p>
                        )}
                        <p>Last active: {formatDate(device.last_active_at)}</p>
                        <p className="text-xs text-neutral-500">
                          Added: {formatDate(device.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  {device.is_active && (
                    <button
                      onClick={() => setDeviceToRevoke(device.id)}
                      disabled={revoking === device.id}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded transition font-medium text-sm flex-shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      {revoking === device.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <LogOut className="w-4 h-4" />
                      )}
                      {revoking === device.id ? "Removing..." : "Remove"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info Box */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 mt-8">
          <h3 className="font-semibold text-white mb-2">How it works</h3>
          <ul className="text-sm text-neutral-400 space-y-1">
            <li>✓ Each device you log into is tracked here</li>
            <li>✓ Removing a device logs it out immediately</li>
            <li>✓ A new login from an unknown device will show here</li>
            <li>✓ You'll receive a notification when this happens</li>
          </ul>
        </div>
      </div>

      <ConfirmationModal
        isOpen={Boolean(deviceToRevoke)}
        onClose={() => setDeviceToRevoke(null)}
        onConfirm={() => deviceToRevoke && handleRevokeDevice(deviceToRevoke)}
        title="Remove Device?"
        description="Are you sure you want to remove this device? This will log you out of that device immediately."
        confirmLabel="Remove Device"
      />
    </div>
  );
}
