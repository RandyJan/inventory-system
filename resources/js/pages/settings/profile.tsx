import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';

import HeadingSmall from '@/components/heading-small';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: edit().url,
    },
];

export default function Profile({
    mustVerifyEmail: _mustVerifyEmail,
    status: _status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Profile information"
                        description="View your account details"
                    />

                    <Card className="border-border">
                        <CardContent className="grid gap-4 pt-6">
                            <div className="grid gap-1">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Name
                                </p>
                                <p className="text-sm font-medium text-foreground">
                                    {auth.user.name}
                                </p>
                            </div>

                            <div className="grid gap-1">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Email Address
                                </p>
                                <p className="text-sm font-medium text-foreground">
                                    {auth.user.email ?? 'No email available'}
                                </p>
                            </div>

                            <div className="grid gap-1">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Account Status
                                </p>
                                <p className="text-sm font-medium text-foreground">
                                    {auth.user.is_active === false ? 'Inactive' : 'Active'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
