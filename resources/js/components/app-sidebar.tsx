import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as auditsIndex } from '@/routes/audits';
import { index as inventoryCategoriesIndex } from '@/routes/inventory-categories';
import { index as itemsIndex } from '@/routes/items';
import { index as permissionsIndex } from '@/routes/permissions';
import { index as rolesIndex } from '@/routes/roles';
import { index as suppliersIndex } from '@/routes/suppliers';
import { index as usersIndex } from '@/routes/users';
import { index as warehousesIndex } from '@/routes/warehouses';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    BoxesIcon,
    FileText,
    Folder,
    LayoutGrid,
    LockKeyhole,
    ShieldCheck,
    Truck,
    Tags,
    Warehouse,
    UsersRound,
} from 'lucide-react';
import AppLogo from './app-logo';

const footerNavItems: NavItem[] = [
    // {
    //     title: 'Repository',
    //     href: 'https://github.com/laravel/react-starter-kit',
    //     icon: Folder,
    // },
    // {
    //     title: 'Documentation',
    //     href: 'https://laravel.com/docs/starter-kits#react',
    //     icon: BookOpen,
    // },
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const permissions = new Set(auth.permissions ?? []);
    const can = (permission: string) => permissions.has(permission);

    const mainNavItems: NavItem[] = [
        ...(can('dashboard.view')
            ? [
                  {
                      title: 'Dashboard',
                      href: dashboard(),
                      icon: LayoutGrid,
                  },
              ]
            : []),
        ...(can('items.view')
            ? [
                  {
                      title: 'Items',
                      href: itemsIndex(),
                      icon: BoxesIcon,
                  },
              ]
            : []),
        ...(can('inventory-categories.view') || can('items.view')
            ? [
                  {
                      title: 'Inventory Categories',
                      href: inventoryCategoriesIndex(),
                      icon: Tags,
                  },
              ]
            : []),
        ...(can('suppliers.view')
            ? [
                  {
                      title: 'Supplier Management',
                      href: suppliersIndex(),
                      icon: Truck,
                  },
              ]
            : []),
        ...(can('warehouses.view')
            ? [
                  {
                      title: 'Warehouse Locations',
                      href: warehousesIndex(),
                      icon: Warehouse,
                  },
              ]
            : []),
        ...(can('users.view')
            ? [
                  {
                      title: 'User Management',
                      href: usersIndex(),
                      icon: UsersRound,
                  },
              ]
            : []),
        ...(can('roles.view')
            ? [
                  {
                      title: 'Role Management',
                      href: rolesIndex(),
                      icon: ShieldCheck,
                  },
              ]
            : []),
        ...(can('permissions.view')
            ? [
                  {
                      title: 'Permission Management',
                      href: permissionsIndex(),
                      icon: LockKeyhole,
                  },
              ]
            : []),
        ...(can('audits.view')
            ? [
                  {
                      title: 'Audit Logs',
                      href: auditsIndex(),
                      icon: FileText,
                  },
              ]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch className="style-none outline-none focus:outline-none focus:ring-0 active:outline-none">
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
