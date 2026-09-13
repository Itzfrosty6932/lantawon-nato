"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { AdminSidebar, AdminTabId, tabLabel } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { useAuth } from "@/context/AuthContext";
import { AdminOverviewTab } from "@/components/admin/tabs/AdminOverviewTab";
import { AdminUsersTab } from "@/components/admin/tabs/AdminUsersTab";
import { AdminPaymentsTab } from "@/components/admin/tabs/AdminPaymentsTab";
import { AdminPackagesTab } from "@/components/admin/tabs/AdminPackagesTab";
import { AdminRefundsTab } from "@/components/admin/tabs/AdminRefundsTab";
import { AdminSupportTab } from "@/components/admin/tabs/AdminSupportTab";
import { AdminAuditsTab } from "@/components/admin/tabs/AdminAuditsTab";

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTabId>("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showPasswordWarning, setShowPasswordWarning] = useState(false);

  useEffect(() => {
    // Show password change warning for admin on first visit
    if (user.role === "admin") {
      const warned = localStorage.getItem("admin_password_warned");
      if (!warned) {
        setShowPasswordWarning(true);
        localStorage.setItem("admin_password_warned", "true");
      }
    }
  }, [user.role]);

  return (
    <div className="flex h-screen flex-col bg-[#0D0D0D] text-white select-none">
      <AdminTopBar title={tabLabel(activeTab)} onOpenMenu={() => setDrawerOpen(true)} />

      {/* PASSWORD CHANGE WARNING */}
      {showPasswordWarning && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-amber-300 font-semibold text-xs sm:text-sm">
              Security: Remember to keep your admin credentials safe
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPasswordWarning(false)}
            className="text-amber-300 hover:text-amber-100 text-xs font-semibold px-2 py-1 rounded bg-amber-500/20"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <AdminSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />

        {/* Edge-to-edge content */}
        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0a0a0c]">
          {activeTab === "overview" && <AdminOverviewTab onNavigate={setActiveTab} />}
          {activeTab === "users" && <AdminUsersTab />}
          {activeTab === "payments" && <AdminPaymentsTab />}
          {activeTab === "subscriptions" && <AdminPackagesTab />}
          {activeTab === "refunds" && <AdminRefundsTab />}
          {activeTab === "support" && <AdminSupportTab />}
          {activeTab === "audits" && <AdminAuditsTab />}
        </main>
      </div>
    </div>
  );
}
