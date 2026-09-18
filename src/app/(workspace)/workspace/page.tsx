import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { PosScreen } from "@/components/pos/pos-screen";

export const metadata = {
  title: "Cashier Workspace | RetailPOS",
  description: "Mobile-first Retail POS Cashier Terminal",
};

export default function WorkspacePage() {
  return (
    <WorkspaceShell>
      <PosScreen />
    </WorkspaceShell>
  );
}
