"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Smartphone,
  Laptop,
  LogOut,
  AlertCircle,
  Loader2,
  Check,
  X,
  ArrowLeft,
  RotateCcw,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  UserDevice,
  getUserDevices,
  revokeDevice,
  revokeAllOtherDevices,
  generateDeviceFingerprint,
} from "@/lib/services/device-service";
import { useToast } from "@/components/ui/Toast";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { audioFX } from "@/lib/audio/audio-fx";

export default function DevicesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [deviceToRevoke, setDeviceToRevoke] = useState<string | null>(null);
  const [showRevokeOthersModal, setShowRevokeOthersModal] = useState(false);
  const [isRevokingOthers, setIsRevokingOthers] = useState(false);
  const [currentFp, setCurrentFp] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentFp(generateDeviceFingerprint());
    }
  }, []);

  useEffect(() => {
    if (!user.isLoggedIn) {
      router.push("/login");
      return;
    }

    loadDevices();
  }, [user, router]);

  const loadDevices = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    const devs = await getUserDevices();
    setDevices(devs || []);

    if (isManualRefresh) {
      setRefreshing(false);
      audioFX.playPop();
      showToast("Device list updated", "info");
    } else {
      setLoading(false);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    audioFX.playClick();
    setDeviceToRevoke(null);
    setRevoking(deviceId);
    const success = await revokeDevice(deviceId);

    if (success) {
      audioFX.playSuccess();
      showToast("Device session disconnected successfully", "success");
      await loadDevices();
    } else {
      showToast("Failed to disconnect device", "error");
    }
    setRevoking(null);
  };

  const handleRevokeAllOtherDevices = async () => {
    audioFX.playClick();
    setShowRevokeOthersModal(false);
    setIsRevokingOthers(true);

    const success = await revokeAllOtherDevices();
    setIsRevokingOthers(false);

    if (success) {
      audioFX.playSuccess();
      showToast("All other devices were signed out successfully", "success");
      await loadDevices();
    } else {
      showToast("Failed to sign out other devices", "error");
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Never";
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
      return <Laptop className="w-5 h-5" />;
    if (osName?.includes("iOS") || osName?.includes("Android"))
      return <Smartphone className="w-5 h-5" />;
    return <Laptop className="w-5 h-5" />;
  };

  if (!user.isLoggedIn) return null;

  const otherActiveDevicesCount = devices.filter(
    (d) => d.is_active && d.device_fingerprint !== currentFp
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-black to-neutral-950 text-white p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Breadcrumb / Back */}
        <div className="flex items-center justify-between">
          <Link
            href="/account"
            onClick={() => audioFX.playClick()}
            className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Account</span>
          </Link>

          <button
            type="button"
            onClick={() => loadDevices(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>STRICT 1-DEVICE CONCURRENCY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-heading tracking-tight">
              Active Sessions & Devices
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Review and manage all devices connected to your Lantawon account.
            </p>
          </div>

          {otherActiveDevicesCount > 0 && (
            <button
              type="button"
              onClick={() => {
                audioFX.playClick();
                setShowRevokeOthersModal(true);
              }}
              disabled={isRevokingOthers}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isRevokingOthers ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              <span>Sign Out Other Devices</span>
            </button>
          )}
        </div>

        {/* Policy Announcement Card */}
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-neutral-900/80 to-neutral-900/80 border border-amber-500/20 p-4 sm:p-5 flex items-start gap-3.5">
          <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-bold text-amber-200">
              Lantawon 1-Active-Screen Policy
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Your account allows <strong>1 active device</strong> at any time. When you sign in from a new browser or phone, all other sessions are automatically disconnected to safeguard your personal subscription and watchlist.
            </p>
          </div>
        </div>

        {/* Devices List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400 px-1">
            <span>TRACKED DEVICES ({devices.length})</span>
            <span>STATUS</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-neutral-950/60 border border-neutral-800/80 rounded-2xl">
              <Loader2 className="w-8 h-8 animate-spin text-[#E31937] mb-3" />
              <p className="text-xs text-neutral-400 font-mono">Loading active device registry...</p>
            </div>
          ) : devices.length === 0 ? (
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-10 text-center space-y-2">
              <p className="text-sm font-semibold text-neutral-300">No devices found</p>
              <p className="text-xs text-neutral-500">
                Devices will appear automatically as you log in from your browsers or phones.
              </p>
            </div>
          ) : (
            devices.map((device) => {
              const isCurrent = Boolean(
                currentFp && device.device_fingerprint && device.device_fingerprint === currentFp
              );

              return (
                <div
                  key={device.id}
                  className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                    isCurrent
                      ? "bg-neutral-900/90 border-emerald-500/50 shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/30"
                      : device.is_active
                      ? "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
                      : "bg-neutral-950/40 border-neutral-900/80 opacity-60"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Device Icon */}
                      <div
                        className={`p-2.5 rounded-xl shrink-0 ${
                          isCurrent
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : device.is_active
                            ? "bg-neutral-800 text-neutral-300 border border-neutral-700"
                            : "bg-neutral-900 text-neutral-500 border border-neutral-800"
                        }`}
                      >
                        {getDeviceIcon(device.os)}
                      </div>

                      {/* Device Details */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-sm text-white truncate">
                            {device.device_name}
                          </h3>

                          {isCurrent && (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              This Device (Current)
                            </span>
                          )}

                          {!isCurrent && device.is_active && (
                            <span className="inline-flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                              <Check className="w-2.5 h-2.5" />
                              Active Session
                            </span>
                          )}

                          {!device.is_active && (
                            <span className="inline-flex items-center gap-1 bg-neutral-800/80 border border-neutral-700/60 text-neutral-400 text-[10px] font-mono px-2 py-0.5 rounded-full">
                              <X className="w-2.5 h-2.5" />
                              Disconnected
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-400">
                          {device.browser && <span>Browser: {device.browser}</span>}
                          {device.os && <span>• OS: {device.os}</span>}
                          {device.ip_address && device.ip_address !== "Unknown" && (
                            <span>• IP: {device.ip_address}</span>
                          )}
                        </div>

                        <div className="text-[11px] font-mono text-neutral-400 pt-0.5">
                          <span>Last active: {formatDate(device.last_active_at)}</span>
                          <span className="ml-2">• Added: {formatDate(device.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Disconnect / Revoke Action */}
                    {!isCurrent && device.is_active && (
                      <button
                        type="button"
                        onClick={() => {
                          audioFX.playClick();
                          setDeviceToRevoke(device.id);
                        }}
                        disabled={revoking === device.id}
                        className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 rounded-xl transition font-semibold text-xs shrink-0 disabled:opacity-50 cursor-pointer"
                      >
                        {revoking === device.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <LogOut className="w-3.5 h-3.5" />
                        )}
                        <span>Disconnect</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Security Alert Footer */}
        <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3 text-xs text-neutral-400">
          <AlertCircle className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
          <p>
            Notice unrecognized devices? Disconnect them immediately and update your password under{" "}
            <Link href="/account" className="text-amber-400 hover:underline font-semibold">
              Account Settings
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Confirmation Modal: Single Device Disconnect */}
      <ConfirmationModal
        isOpen={Boolean(deviceToRevoke)}
        onClose={() => setDeviceToRevoke(null)}
        onConfirm={() => deviceToRevoke && handleRevokeDevice(deviceToRevoke)}
        title="Disconnect Device?"
        description="Are you sure you want to disconnect this device? It will be logged out of your Lantawon account immediately."
        confirmLabel="Disconnect Device"
      />

      {/* Confirmation Modal: Revoke All Other Devices */}
      <ConfirmationModal
        isOpen={showRevokeOthersModal}
        onClose={() => setShowRevokeOthersModal(false)}
        onConfirm={handleRevokeAllOtherDevices}
        title="Sign Out All Other Devices?"
        description="This will instantly log your account out of all other browsers, laptops, and mobile devices. Only this current device will stay signed in."
        confirmLabel="Sign Out Others"
      />
    </div>
  );
}
