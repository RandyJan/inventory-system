import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { index as itemsIndex, store } from '@/routes/items';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, PackagePlus } from 'lucide-react';
import { ItemForm } from './partials/item-form';

type CreateItemProps = {
    categories: {
        id: number;
        name: string;
        subcategories: {
            id: number;
            name: string;
        }[];
    }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Items', href: itemsIndex().url },
    { title: 'Create', href: '#' },
];

export default function CreateItem({ categories }: CreateItemProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Item" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-3">
                        <Link
                            href={itemsIndex().url}
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="size-4" />
                            Back to items
                        </Link>
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-semibold">
                                    Create Item
                                </h1>
                                <Badge variant="outline">
                                    <PackagePlus className="size-3.5" />
                                    New record
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Add a sellable, purchasable, or stock-tracked
                                item to the master list.
                            </p>
                        </div>
                    </div>

                    <Link
                        href={itemsIndex().url}
                        className={cn(buttonVariants({ variant: 'outline' }))}
                    >
                        Cancel
                    </Link>
                </div>

                <ItemForm
                    action={store.form()}
                    categories={categories}
                    submitLabel="Create item"
                    description="Enter the item details that purchasing, sales, and stock workflows will use."
                />
            </div>
        </AppLayout>
    );
}
