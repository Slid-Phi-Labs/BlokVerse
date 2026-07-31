import type { ReactNode } from "react";

/**
 * Passthrough — we do not use @solana/wallet-adapter (breaks SSR).
 * Wallet connect is handled by WalletConnectModal + window.phantom/solana.
 */
export function SolanaWalletProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
