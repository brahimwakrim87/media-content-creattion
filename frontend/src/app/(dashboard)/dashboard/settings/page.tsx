"use client";

import { useState } from "react";
import { Settings, ShieldAlert, Check } from "lucide-react";
import { useSettings, useUpdateSetting, type SettingItem } from "@/lib/hooks/use-settings";
import { useAuthStore } from "@/lib/auth";
import { cn } from "@/lib/utils";

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

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { data, isLoading, error } = useSettings();

  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  if (!isAdmin) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">
            You need admin access to manage settings.
          </p>
        </div>
      </div>
    );
  }

  const settings = data?.member ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Configure application-wide settings
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border bg-gray-50"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
          Failed to load settings.
        </div>
      ) : (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Application Settings
            </h2>
          </div>
          <div className="space-y-3">
            {settings.map((setting) => (
              <SettingRow key={setting.id} setting={setting} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
