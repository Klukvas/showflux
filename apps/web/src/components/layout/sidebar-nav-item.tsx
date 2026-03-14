'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

interface SidebarNavItemProps {
  readonly href: string;
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly onClick?: () => void;
}

export function SidebarNavItem({ href, icon, label, onClick }: SidebarNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
      )}
    >
      <span className="h-5 w-5">{icon}</span>
      {label}
    </Link>
  );
}
