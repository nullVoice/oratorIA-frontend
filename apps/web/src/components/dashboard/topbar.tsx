import { Bell, ChevronDown, LogOut, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { User } from "@/lib/api/schemas";
import { initialsOf, namePartOfEmail } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

interface TopbarProps {
  user: User;
  crumb?: string;
}

export function Topbar({ user, crumb = "Inicio" }: TopbarProps) {
  const displayName = user.full_name ?? namePartOfEmail(user.email);
  const firstName = displayName.split(" ")[0] ?? displayName;

  return (
    <header className="flex h-16 items-center gap-6 border-b border-gray-200 bg-white px-8">
      <div className="text-[13px] font-medium text-gray-500">
        <strong className="font-bold text-[#0A0A0A]">{crumb}</strong>
      </div>

      <div className="relative max-w-sm flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar sesiones, ejercicios, badges…"
          className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-12 text-[13px] outline-none transition-colors focus:border-[#C6FF3D] focus:bg-white focus:ring-2 focus:ring-[#C6FF3D]/20"
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-gray-500">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          aria-label="Notificaciones"
          className="relative grid h-9 w-9 place-items-center rounded-[9px] border border-gray-200 bg-gray-50 text-gray-700 transition-colors hover:bg-gray-100 hover:text-[#0A0A0A]"
          title="Próximamente"
        >
          <Bell className="h-4 w-4" strokeWidth={1.8} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-[#C6FF3D]" />
        </button>

        <UserMenu name={firstName} initials={initialsOf(displayName)} />
      </div>
    </header>
  );
}

function UserMenu({ name, initials }: { name: string; initials: string }) {
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 py-1 pl-1 pr-3 transition-colors hover:bg-gray-100"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[#C6FF3D] to-[#5C7A0F] text-[10px] font-extrabold text-[#0A0A0A]">
          {initials}
        </span>
        <span className="text-[13px] font-semibold text-[#0A0A0A]">{name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <button
            type="button"
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:text-[#0A0A0A]"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.8} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
