"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { AdminSidebar, AdminTabId, tabLabel } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { useAuth } from "@/context/AuthContext";
import { AdminOverviewTab } from "@/components/admin/tabs/AdminOverviewTab";
import { AdminMirrorsTab } from "@/components/admin/tabs/AdminMirrorsTab";
import { AdminUsersTab } from "@/components/admin/tabs/AdminUsersTab";
import { AdminPaymentsTab } from "@/components/admin/tabs/AdminPaymentsTab";
import { AdminPackagesTab } from "@/components/admin/tabs/AdminPackagesTab";
import { AdminRefundsTab } from "@/components/admin/tabs/AdminRefundsTab";
import { AdminLeaderboardsTab } from "@/components/admin/tabs/AdminLeaderboardsTab";
import { AdminSupportTab } from "@/components/admin/tabs/AdminSupportTab";
import { AdminChangelogTab } from "@/components/admin/tabs/AdminChangelogTab";
import { AdminAuditsTab } from "@/components/admin/tabs/AdminAuditsTab";
import { AdminBugsTab } from "@/components/admin/tabs/AdminBugsTab";

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
    <div className="flex h-screen flex-col bg-black text-white">
      <AdminTopBar title={tabLabel(activeTab)} onOpenMenu={() => setDrawerOpen(true)} />

      {/* PASSWORD CHANGE WARNING */}
      {showPasswordWarning && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-amber-300 font-semibold text-sm">
              ⚠️ Security: Change your admin password immediately
            </p>
            <p className="text-amber-200 text-xs mt-1">
              Go to your account settings to set a strong password.
            </p>
          </div>
          <button
            onClick={() => setShowPasswordWarning(false)}
            className="text-amber-300 hover:text-amber-100 text-sm font-medium"
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

        {/* Edge-to-edge content: full width, small consistent padding only. */}
        <main className="min-w-0 flex-1 overflow-y-auto p-4">
          {activeTab === "overview" && <AdminOverviewTab onNavigate={setActiveTab} />}
          {activeTab === "mirrors" && <AdminMirrorsTab />}
          {activeTab === "users" && <AdminUsersTab />}
          {activeTab === "payments" && <AdminPaymentsTab />}
          {activeTab === "subscriptions" && <AdminPackagesTab />}
          {activeTab === "refunds" && <AdminRefundsTab />}
          {activeTab === "leaderboards" && <AdminLeaderboardsTab />}
          {activeTab === "support" && <AdminSupportTab />}
          {activeTab === "changelog" && <AdminChangelogTab />}
          {activeTab === "audits" && <AdminAuditsTab />}
          {activeTab === "bugs" && <AdminBugsTab />}
        </main>
      </div>
    </div>
  );
}
