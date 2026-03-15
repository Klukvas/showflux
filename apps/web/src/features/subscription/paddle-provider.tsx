"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";

interface PaddleContextValue {
  readonly paddle: Paddle | null;
  readonly isReady: boolean;
}

const PaddleContext = createContext<PaddleContextValue>({
  paddle: null,
  isReady: false,
});

export function usePaddle() {
  return useContext(PaddleContext);
}

interface PaddleProviderProps {
  readonly children: ReactNode;
}

export function PaddleProvider({ children }: PaddleProviderProps) {
  const [paddle, setPaddle] = useState<Paddle | null>(null);

  useEffect(() => {
    const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    if (!clientToken) return;

    const environment =
      process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "production"
        ? ("production" as const)
        : ("sandbox" as const);

    initializePaddle({
      token: clientToken,
      environment,
    }).then((instance) => {
      if (instance) {
        setPaddle(instance);
      }
    });
  }, []);

  const value: PaddleContextValue = {
    paddle,
    isReady: paddle !== null,
  };

  return (
    <PaddleContext.Provider value={value}>{children}</PaddleContext.Provider>
  );
}
