import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Web3Provider } from "@/lib/web3/providers";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Web3Provider>
      <div className="flex min-h-screen bg-[#0a0a0f]">
        <Sidebar />
        <main className="flex-1 pb-20 md:pb-0 overflow-auto">
          {children}
        </main>
        <MobileNav />
      </div>
    </Web3Provider>
  );
}
