import { ChartLine, House, LayoutDashboard, MegaphoneOff, QrCode, Settings, type LucideIcon } from "lucide-react";

export interface NavItem {
  /** Key in the `nav` dictionary. */
  label: "dashboard" | "home" | "qrCodes" | "analytics" | "campaigns" | "settings";
  href: string;
  /** Route prefix that marks the item active. */
  match: string;
  icon: LucideIcon;
}

export const SIDEBAR_NAV: NavItem[] = [
  { label: "dashboard", href: "/dashboard", match: "/dashboard", icon: LayoutDashboard },
  { label: "qrCodes", href: "/qr-codes", match: "/qr-codes", icon: QrCode },
  { label: "analytics", href: "/analytics", match: "/analytics", icon: ChartLine },
  { label: "campaigns", href: "/campaigns", match: "/campaigns", icon: MegaphoneOff },
  { label: "settings", href: "/settings", match: "/settings", icon: Settings },
];

/** Bottom tab bar from the mobile frames; the center slot is the create FAB. */
export const MOBILE_TABS: { left: NavItem[]; right: NavItem[] } = {
  left: [
    { label: "home", href: "/dashboard", match: "/dashboard", icon: House },
    { label: "qrCodes", href: "/qr-codes", match: "/qr-codes", icon: QrCode },
  ],
  right: [
    { label: "analytics", href: "/analytics", match: "/analytics", icon: ChartLine },
    { label: "settings", href: "/settings", match: "/settings", icon: Settings },
  ],
};

export function isActive(pathname: string, match: string): boolean {
  return pathname === match || pathname.startsWith(`${match}/`);
}
