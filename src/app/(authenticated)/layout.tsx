import { TopHeader } from "@/components/layout/top-header";
import { MobileNav } from "@/components/layout/mobile-nav";
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
      <div className="flex min-h-screen flex-col bg-surface">
        <TopHeader />
        <main className="flex-1 overflow-auto pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          <RouteTransition>{children}</RouteTransition>
        </main>
        <PageFooter />
        <MobileNav />
      </div>
    </Web3Provider>
  );
}
