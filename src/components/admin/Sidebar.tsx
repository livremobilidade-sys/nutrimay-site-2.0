"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  BarChart2, Users, Package, Settings, LogOut, 
  CheckCircle, PlusCircle, LayoutDashboard, Search, MapPin, Truck, Calendar
} from "lucide-react";

const navItems = [
  { name: "Visão Geral", icon: BarChart2, href: "/admin" },
  { name: "Pedidos", icon: Package, href: "/admin/orders" },
  { name: "Lotes de Entrega", icon: Calendar, href: "/admin/batches" },
  { name: "Entregas", icon: Truck, href: "/admin/deliveries" },
  { name: "Clientes", icon: Users, href: "/admin/users" },
  { name: "Gestão de Catálogo", icon: Package, href: "/admin/products" },
  { name: "Pontos de Retirada", icon: MapPin, href: "/admin/pickup-points" },
  { name: "Configurações", icon: Settings, href: "/admin/settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 bg-[#0c0c0e] border-r border-white/5 flex flex-col h-screen fixed left-0 top-0 z-50">
      {/* Brand */}
      <div className="p-8 pb-12">
         <Link href="/" className="flex items-center gap-1 group">
            <span className="text-xl font-black text-white tracking-tighter uppercase transition-colors group-hover:text-[#22C55E]">
                MayNutri
            </span>
            <div className="w-2 h-2 rounded-full bg-[#22C55E] shadow-[0_0_10px_#22C55E]" />
            <span className="text-[10px] font-bold text-white/20 uppercase ml-2 tracking-widest border border-white/5 px-2 py-0.5 rounded-full">Admin</span>
         </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group relative overflow-hidden ${
                isActive ? 'bg-white/5 text-[#22C55E]' : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-[#22C55E]"
                  initial={{ x: -10 }}
                  animate={{ x: 0 }}
                />
              )}
              <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-[#22C55E]' : ''}`} />
              <span className="text-[11px] font-black uppercase tracking-widest">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-8 border-t border-white/5">
         <button className="flex items-center gap-4 w-full px-6 py-4 rounded-2xl text-white/20 hover:text-red-500 hover:bg-red-500/5 transition-all group">
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[11px] font-black uppercase tracking-widest">Sair do Painel</span>
         </button>
      </div>
    </aside>
  );
}
