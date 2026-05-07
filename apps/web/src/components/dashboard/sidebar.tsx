import { Link } from "@tanstack/react-router";
import { ChevronDown, Home, type LucideIcon } from "lucide-react";

import {
  navAccountPlaceholders,
  navMainPlaceholders,
} from "@/lib/dashboard/mock-data";
import { cn, initialsOf, namePartOfEmail } from "@/lib/utils";
import type { User } from "@/lib/api/schemas";

interface SidebarProps {
  user: User;
}

export function Sidebar({ user }: SidebarProps) {
  const displayName = user.full_name ?? namePartOfEmail(user.email);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-white px-3.5 py-5">
      <div className="px-2 pb-6 pt-1">
        <img src="/OratorIA-lockup.svg" alt="OratorIA" className="h-7" />
      </div>

      <UserPill name={displayName} plan={user.plan} />

      <SidebarSection label="Principal">
        <SidebarLink icon={Home} label="Inicio" active />
        {navMainPlaceholders.map((link) => (
          <SidebarLink
            key={link.id}
            icon={link.icon}
            label={link.label}
            badge={link.badge}
            disabled
          />
        ))}
      </SidebarSection>

      <SidebarSection label="Cuenta">
        {navAccountPlaceholders.map((link) => (
          <SidebarLink
            key={link.id}
            icon={link.icon}
            label={link.label}
            badge={link.badge}
            disabled
          />
        ))}
      </SidebarSection>

      <UpgradeCard plan={user.plan} />
    </aside>
  );
}

function UserPill({ name, plan }: { name: string; plan: User["plan"] }) {
  return (
    <button
      type="button"
      className="mb-5 flex w-full items-center gap-2.5 rounded-[10px] bg-gray-50 p-2.5 text-left transition-colors hover:bg-gray-100"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gray-200 text-xs font-bold text-[#0A0A0A]">
        {initialsOf(name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-[#0A0A0A]">
          {name}
        </span>
        <span className="block text-[11px] capitalize text-gray-500">
          Plan {plan}
        </span>
      </span>
      <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
    </button>
  );
}

function SidebarSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="px-2 pb-2 text-xs font-semibold text-gray-400">{label}</div>
      {children}
    </div>
  );
}

function SidebarLink({
  icon: Icon,
  label,
  badge,
  active = false,
  disabled = false,
}: {
  icon: LucideIcon;
  label: string;
  badge?: string;
  active?: boolean;
  disabled?: boolean;
}) {
  const className = cn(
    "mb-0.5 flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-[13px] font-medium transition-colors",
    active && "bg-[#0A0A0A] text-[#C6FF3D] font-semibold",
    !active && !disabled && "text-gray-700 hover:bg-gray-100 hover:text-[#0A0A0A]",
    disabled && "cursor-not-allowed text-gray-400",
  );

  const content = (
    <>
      <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
      <span className="flex-1">{label}</span>
      {badge && (
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
            active ? "bg-[#C6FF3D] text-[#0A0A0A]" : "bg-gray-100 text-gray-600",
          )}
        >
          {badge}
        </span>
      )}
    </>
  );

  if (disabled) {
    return (
      <span className={className} title="Próximamente">
        {content}
      </span>
    );
  }
  return (
    <Link to="/dashboard" className={className}>
      {content}
    </Link>
  );
}

function UpgradeCard({ plan }: { plan: User["plan"] }) {
  if (plan !== "free") return null;
  return (
    <div className="mt-auto rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs text-gray-600">2 de 3 sesiones usadas este mes.</p>
      <h4 className="mt-1.5 text-sm font-bold text-[#0A0A0A]">
        Sesiones ilimitadas con Pro
      </h4>
      <button
        type="button"
        className="mt-3 w-full rounded-lg bg-[#0A0A0A] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-gray-800"
      >
        Cambiar a Pro
      </button>
    </div>
  );
}
