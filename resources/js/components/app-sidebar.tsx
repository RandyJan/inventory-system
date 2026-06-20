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
import { index as approvalWorkflowsIndex } from '@/routes/approval-workflows';
import { index as auditsIndex } from '@/routes/audits';
import { index as inventoryAdjustmentsIndex } from '@/routes/inventory-adjustments';
import { index as inventoryCategoriesIndex } from '@/routes/inventory-categories';
import { index as itemsIndex } from '@/routes/items';
import { index as permissionsIndex } from '@/routes/permissions';
import { index as purchaseOrdersIndex } from '@/routes/purchase-orders';
import { index as purchaseRequisitionsIndex } from '@/routes/purchase-requisitions';
import { index as reportsIndex } from '@/routes/reports';
import { index as rolesIndex } from '@/routes/roles';
import { index as stockCountsIndex } from '@/routes/stock-counts';
import { index as stockIssuancesIndex } from '@/routes/stock-issuances';
import { index as stockReceivingsIndex } from '@/routes/stock-receivings';
import { index as stockTransfersIndex } from '@/routes/stock-transfers';
import { index as suppliersIndex } from '@/routes/suppliers';
import { index as usersIndex } from '@/routes/users';
import { index as warehousesIndex } from '@/routes/warehouses';
import { type NavGroup, type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BoxesIcon,
    ClipboardCheck,
    ClipboardList,
    FileText,
    FileTextIcon,
    LayoutGrid,
    LockKeyhole,
    PackageCheck,
    PackageMinus,
    Repeat,
    ShieldCheck,
    ShoppingCart,
    SlidersHorizontal,
    Tags,
    Truck,
    UsersRound,
    Warehouse,
    Workflow,
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

    const navGroups: NavGroup[] = [
        {
            title: 'Overview',
            items: [
                ...(can('dashboard.view')
                    ? [
                          {
                              title: 'Dashboard',
                              href: dashboard(),
                              icon: LayoutGrid,
                          },
                      ]
                    : []),
            ],
        },
        {
            title: 'Inventory Setup',
            items: [
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
                ...(can('warehouses.view')
                    ? [
                          {
                              title: 'Warehouse Locations',
                              href: warehousesIndex(),
                              icon: Warehouse,
                          },
                      ]
                    : []),
            ],
        },
        {
            title: 'Stock Operations',
            items: [
                ...(can('stock-receivings.view')
                    ? [
                          {
                              title: 'Stock Receiving',
                              href: stockReceivingsIndex(),
                              icon: PackageCheck,
                          },
                      ]
                    : []),
                ...(can('stock-issuances.view')
                    ? [
                          {
                              title: 'Stock Issuance',
                              href: stockIssuancesIndex(),
                              icon: PackageMinus,
                          },
                      ]
                    : []),
                ...(can('stock-transfers.view')
                    ? [
                          {
                              title: 'Stock Transfers',
                              href: stockTransfersIndex(),
                              icon: Repeat,
                          },
                      ]
                    : []),
                ...(can('inventory-adjustments.view')
                    ? [
                          {
                              title: 'Inventory Adjustments',
                              href: inventoryAdjustmentsIndex(),
                              icon: SlidersHorizontal,
                          },
                      ]
                    : []),
                ...(can('stock-counts.view')
                    ? [
                          {
                              title: 'Stock Counts',
                              href: stockCountsIndex(),
                              icon: ClipboardCheck,
                          },
                      ]
                    : []),
            ],
        },
        {
            title: 'Purchasing',
            items: [
                ...(can('suppliers.view')
                    ? [
                          {
                              title: 'Supplier Management',
                              href: suppliersIndex(),
                              icon: Truck,
                          },
                      ]
                    : []),
                ...(can('purchase-requisitions.view')
                    ? [
                          {
                              title: 'Purchase Requisitions',
                              href: purchaseRequisitionsIndex(),
                              icon: ClipboardList,
                          },
                      ]
                    : []),
                ...(can('purchase-orders.view')
                    ? [
                          {
                              title: 'Purchase Orders',
                              href: purchaseOrdersIndex(),
                              icon: ShoppingCart,
                          },
                      ]
                    : []),
            ],
        },
        {
            title: 'Reports & Audit',
            items: [
                ...(can('reports.view')
                    ? [
                          {
                              title: 'Reports',
                              href: reportsIndex(),
                              icon: FileTextIcon,
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
            ],
        },
        {
            title: 'Administration',
            items: [
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
                ...(can('approval-workflows.view')
                    ? [
                          {
                              title: 'Approval Workflows',
                              href: approvalWorkflowsIndex(),
                              icon: Workflow,
                          },
                      ]
                    : []),
            ],
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link
                                href={dashboard()}
                                prefetch
                                className="style-none outline-none focus:ring-0 focus:outline-none active:outline-none"
                            >
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain groups={navGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
