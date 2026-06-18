import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { index as itemsIndex, show, update } from '@/routes/items';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, PencilLine } from 'lucide-react';
import { ItemForm, type ItemFormRecord } from './partials/item-form';

type EditItemProps = {
    item: ItemFormRecord;
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
    { title: 'Edit', href: '#' },
];

export default function EditItem({ item, categories }: EditItemProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${item.name}`} />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-3">
                        <Link
                            href={show(item.id).url}
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="size-4" />
                            Back to item
                        </Link>
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-semibold">
                                    Edit Item
                                </h1>
                                <Badge variant="outline">
                                    <PencilLine className="size-3.5" />
                                    {item.item_code}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Update classification, stock thresholds, and
                                pricing for {item.name}.
                            </p>
                        </div>
                    </div>

                    <Link
                        href={itemsIndex().url}
                        className={cn(buttonVariants({ variant: 'outline' }))}
                    >
                        Items list
                    </Link>
                </div>

                <ItemForm
                    action={update.form(item.id)}
                    categories={categories}
                    item={item}
                    submitLabel="Update item"
                    description="Keep the master data accurate for downstream inventory workflows."
                    showArchiveControl
                />
            </div>
        </AppLayout>
    );
}
