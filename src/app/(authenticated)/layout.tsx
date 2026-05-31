import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { EnvironmentalHeader } from "@/components/layout/environmental-header";
import { PageFooter } from "@/components/layout/page-footer";
import { Web3Provider } from "@/lib/web3/providers";
import { RouteTransition } from "@/components/layout/route-transition";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Web3Provider>
      <div className="flex min-h-screen bg-surface">
        <Sidebar />
        <div className="flex flex-1 flex-col min-h-screen">
          <EnvironmentalHeader />
          <main className="flex-1 pb-20 md:pb-0 overflow-auto">
            <RouteTransition>{children}</RouteTransition>
          </main>
          <PageFooter />
        </div>
        <MobileNav />
      </div>
    </Web3Provider>
  );
}
