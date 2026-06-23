import { showGlobalLoadingIndicator } from '@/components/global-loading-indicator';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { resolveUrl } from '@/lib/utils';
import { type NavGroup, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type MouseEvent } from 'react';

export function NavMain({
    items = [],
    groups = [],
}: {
    items?: NavItem[];
    groups?: NavGroup[];
}) {
    const page = usePage();
    const navGroups =
        groups.length > 0 ? groups : [{ title: 'Platform', items }];

    const showLoadingOnModuleClick = (
        event: MouseEvent<Element>,
        item: NavItem,
    ) => {
        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            page.url === resolveUrl(item.href)
        ) {
            return;
        }

        showGlobalLoadingIndicator();
    };

    return (
        <>
            {navGroups.map((group) =>
                group.items.length > 0 ? (
                    <SidebarGroup key={group.title} className="px-2 py-0">
                        <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                        <SidebarMenu>
                            {group.items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={page.url.startsWith(
                                            resolveUrl(item.href),
                                        )}
                                        tooltip={{ children: item.title }}
                                    >
                                        <Link
                                            href={item.href}
                                            prefetch
                                            onClick={(event) =>
                                                showLoadingOnModuleClick(
                                                    event,
                                                    item,
                                                )
                                            }
                                        >
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                ) : null,
            )}
        </>
    );
}
