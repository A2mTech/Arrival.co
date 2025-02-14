import { MobileSidenav } from "@/app/(app)/_components/mobile-sidenav";
import { Icons } from "@/components/ui/icons";

type AppHeaderProps = {
    sidebarNavIncludeIds?: string[];
    sidebarNavRemoveIds?: string[];
    showOrgSwitcher?: boolean;
};

export function AppHeader({
    sidebarNavIncludeIds,
    sidebarNavRemoveIds,
}: AppHeaderProps) {
    return (
        <header className="flex h-14 items-center gap-4">
            <MobileSidenav
                sidebarNavIncludeIds={sidebarNavIncludeIds}
                sidebarNavRemoveIds={sidebarNavRemoveIds}
            />
            <Icons.logo hideTextOnMobile={false} />
        </header>
    );
}
