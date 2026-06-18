// Components
import TextLink from '@/components/text-link';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { Head } from '@inertiajs/react';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Verify email"
            description="Email verification is not required for LDAP authenticated users."
        >
            <Head title="Email verification" />

            <div className="space-y-6 text-center">
                <p className="text-sm text-muted-foreground">
                    Email verification is disabled for Active Directory users.
                </p>

                <TextLink href={logout()} className="mx-auto block text-sm">
                    Log out
                </TextLink>
            </div>
        </AuthLayout>
    );
}
