"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

type AuthTab = "login" | "register";

interface AuthModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly initialTab?: AuthTab;
}

export function AuthModal({
  isOpen,
  onClose,
  initialTab = "login",
}: AuthModalProps) {
  const [tab, setTab] = useState<AuthTab>(initialTab);
  const router = useRouter();
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setTab(initialTab);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialTab]);

  const handleSuccess = useCallback(() => {
    onClose();
    router.push("/dashboard");
  }, [onClose, router]);

  const title = tab === "login" ? "Sign In" : "Create Account";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-md">
      <div
        role="tablist"
        aria-label="Authentication"
        className="mb-4 flex rounded-lg bg-gray-100 p-1"
      >
        <button
          role="tab"
          type="button"
          aria-selected={tab === "login"}
          onClick={() => setTab("login")}
          className={cn(
            "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            tab === "login"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700",
          )}
        >
          Sign In
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={tab === "register"}
          onClick={() => setTab("register")}
          className={cn(
            "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            tab === "register"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700",
          )}
        >
          Register
        </button>
      </div>

      <div role="tabpanel">
        {tab === "login" ? (
          <LoginForm
            embedded
            onSuccess={handleSuccess}
            onSwitchToRegister={() => setTab("register")}
          />
        ) : (
          <RegisterForm
            embedded
            onSuccess={handleSuccess}
            onSwitchToLogin={() => setTab("login")}
          />
        )}
      </div>
    </Modal>
  );
}
