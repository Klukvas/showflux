'use client';

import { useEffect } from 'react';
import { Sidebar } from './sidebar';

interface MobileNavProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 z-50 w-64">
        <Sidebar onNavClick={onClose} />
      </div>
    </div>
  );
}
