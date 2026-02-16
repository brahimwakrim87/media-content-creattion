"use client";

import { useState, useRef } from "react";
import {
  Settings,
  User as UserIcon,
  Bell,
  Shield,
  Check,
  Camera,
  Loader2,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  useProfile,
  useUpdateProfile,
  useChangePassword,
  useUploadAvatar,
  usePreferences,
  useUpdatePreferences,
} from "@/lib/hooks/use-profile";
import {
  useSettings,
  useUpdateSetting,
  type SettingItem,
} from "@/lib/hooks/use-settings";
import { useAuthStore } from "@/lib/auth";
import { cn } from "@/lib/utils";

/* ── Tab types ── */
type Tab = "profile" | "notifications" | "system";

/* ── Profile Tab ── */
function ProfileTab() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const uploadAvatar = useUploadAvatar();
  const fileRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileDirty, setProfileDirty] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Sync form when profile loads
  const [syncedId, setSyncedId] = useState<string | null>(null);
  if (profile && profile.id !== syncedId) {
    setFirstName(profile.firstName || "");
    setLastName(profile.lastName || "");
    setSyncedId(profile.id);
    setProfileDirty(false);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg border bg-gray-50"
          />
        ))}
      </div>
    );
  }

  if (!profile) return null;

  const handleProfileSave = async () => {
    try {
      await updateProfile.mutateAsync({ firstName, lastName });
      setProfileDirty(false);
      toast.success("Profile updated successfully.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update profile.");
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully.");
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Failed to change password."
      );
    }
  };

  const handleAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAvatar.mutateAsync(file);
      toast.success("Avatar updated.");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload avatar."
      );
    }
  };

  const avatarLetter = (
    profile.firstName ||
    profile.email ||
    "U"
  )
    .charAt(0)
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Avatar + basic info */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Profile</h2>
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="Avatar"
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
                {avatarLetter}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadAvatar.isPending}
              className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-blue-600 p-1.5 text-white shadow hover:bg-blue-700 disabled:opacity-50"
            >
              {uploadAvatar.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          {/* Name fields */}
          <div className="flex-1 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  First name
                </label>
                <input
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setProfileDirty(true);
                  }}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Last name
                </label>
                <input
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setProfileDirty(true);
                  }}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                value={profile.email}
                disabled
                className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-500"
              />
            </div>
            {profileDirty && (
              <button
                onClick={handleProfileSave}
                disabled={updateProfile.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {updateProfile.isPending ? "Saving..." : "Save changes"}
              </button>
            )}
          </div>
        </div>

        {/* Account info */}
        <div className="mt-6 grid gap-4 border-t pt-4 text-sm text-gray-500 sm:grid-cols-3">
          <div>
            <span className="font-medium text-gray-700">Roles: </span>
            {profile.roleEntities.map((r) => r.name).join(", ") || "user"}
          </div>
          <div>
            <span className="font-medium text-gray-700">Member since: </span>
            {new Date(profile.createdAt).toLocaleDateString()}
          </div>
          <div>
            <span className="font-medium text-gray-700">Email verified: </span>
            {profile.emailVerified ? "Yes" : "No"}
          </div>
        </div>
      </div>

      {/* Password change */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Key className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Change Password
          </h2>
        </div>
        <div className="max-w-md space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Current password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              New password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handlePasswordChange}
            disabled={
              changePassword.isPending ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword
            }
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {changePassword.isPending ? "Changing..." : "Change password"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Notifications Tab ── */
const PREF_LABELS: Record<string, { label: string; description: string }> = {
  "notify.content": {
    label: "Content updates",
    description: "Get notified when content is created, updated, or approved",
  },
  "notify.publication": {
    label: "Publication events",
    description: "Get notified when content is published or fails to publish",
  },
  "notify.campaign": {
    label: "Campaign updates",
    description: "Get notified about campaign status changes",
  },
  "notify.generation": {
    label: "AI generation",
    description: "Get notified when AI content generation completes",
  },
  "notify.mention": {
    label: "Mentions",
    description: "Get notified when someone mentions you in a comment",
  },
  "notify.member": {
    label: "Team membership",
    description:
      "Get notified when you are added or removed from a campaign team",
  },
  "notify.email": {
    label: "Email notifications",
    description: "Receive notification emails in addition to in-app alerts",
  },
};

function NotificationsTab() {
  const { data: prefs, isLoading } = usePreferences();
  const updatePrefs = useUpdatePreferences();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg border bg-gray-50"
          />
        ))}
      </div>
    );
  }

  if (!prefs) return null;

  const handleToggle = (key: string) => {
    const newVal = prefs[key] === "true" ? "false" : "true";
    updatePrefs.mutate({ [key]: newVal });
  };

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Bell className="h-5 w-5 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-900">
          Notification Preferences
        </h2>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Choose which notifications you want to receive.
      </p>
      <div className="space-y-3">
        {Object.entries(PREF_LABELS).map(([key, { label, description }]) => (
          <div
            key={key}
            className="flex items-center justify-between gap-4 rounded-lg border p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="mt-0.5 text-xs text-gray-500">{description}</p>
            </div>
            <button
              onClick={() => handleToggle(key)}
              disabled={updatePrefs.isPending}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50",
                prefs[key] === "true" ? "bg-blue-600" : "bg-gray-200"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200",
                  prefs[key] === "true" ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── System Settings Tab (admin only) ── */
function SettingRow({ setting }: { setting: SettingItem }) {
  const [localValue, setLocalValue] = useState(setting.value);
  const updateSetting = useUpdateSetting(setting.id);
  const isDirty = localValue !== setting.value;

  const handleSave = async () => {
    await updateSetting.mutateAsync(localValue);
  };

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{setting.key}</p>
        {setting.description && (
          <p className="mt-0.5 text-xs text-gray-500">{setting.description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {setting.type === "boolean" ? (
          <button
            onClick={() => {
              const newVal = localValue === "true" ? "false" : "true";
              setLocalValue(newVal);
              updateSetting.mutate(newVal);
            }}
            disabled={updateSetting.isPending}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50",
              localValue === "true" ? "bg-blue-600" : "bg-gray-200"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200",
                localValue === "true" ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        ) : setting.type === "integer" ? (
          <>
            <input
              type="number"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              className="w-24 rounded-lg border px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {isDirty && (
              <button
                onClick={handleSave}
                disabled={updateSetting.isPending}
                className="rounded-lg bg-blue-600 p-1.5 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
              </button>
            )}
          </>
        ) : (
          <>
            <input
              type="text"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              className="w-48 rounded-lg border px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {isDirty && (
              <button
                onClick={handleSave}
                disabled={updateSetting.isPending}
                className="rounded-lg bg-blue-600 p-1.5 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SystemSettingsTab() {
  const { data, isLoading, error } = useSettings();
  const settings = data?.member ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg border bg-gray-50"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
        Failed to load settings.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-900">
          Application Settings
        </h2>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        System-wide configuration. Changes affect all users.
      </p>
      <div className="space-y-3">
        {settings.map((setting) => (
          <SettingRow key={setting.id} setting={setting} />
        ))}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function SettingsPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("profile");
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  const tabs: { key: Tab; label: string; icon: typeof Settings; adminOnly?: boolean }[] = [
    { key: "profile", label: "Profile", icon: UserIcon },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "system", label: "System", icon: Shield, adminOnly: true },
  ];

  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your profile, preferences, and application settings
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border bg-gray-50 p-1">
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "profile" && <ProfileTab />}
      {tab === "notifications" && <NotificationsTab />}
      {tab === "system" && isAdmin && <SystemSettingsTab />}
    </div>
  );
}
