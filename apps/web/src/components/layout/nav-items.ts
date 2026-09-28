import { ChartLine, House, LayoutDashboard, MegaphoneOff, QrCode, Settings, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  /** Route prefix that marks the item active. */
  match: string;
  icon: LucideIcon;
}

export const SIDEBAR_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", match: "/dashboard", icon: LayoutDashboard },
  { label: "QR Codes", href: "/qr-codes", match: "/qr-codes", icon: QrCode },
  { label: "Analytics", href: "/analytics", match: "/analytics", icon: ChartLine },
  { label: "Campaigns", href: "/campaigns", match: "/campaigns", icon: MegaphoneOff },
  { label: "Settings", href: "/settings", match: "/settings", icon: Settings },
];

/** Bottom tab bar from the mobile frames; the center slot is the create FAB. */
export const MOBILE_TABS: { left: NavItem[]; right: NavItem[] } = {
  left: [
    { label: "Home", href: "/dashboard", match: "/dashboard", icon: House },
    { label: "QR Codes", href: "/qr-codes", match: "/qr-codes", icon: QrCode },
  ],
  right: [
    { label: "Analytics", href: "/analytics", match: "/analytics", icon: ChartLine },
    { label: "Settings", href: "/settings", match: "/settings", icon: Settings },
  ],
};

export function isActive(pathname: string, match: string): boolean {
  return pathname === match || pathname.startsWith(`${match}/`);
}
