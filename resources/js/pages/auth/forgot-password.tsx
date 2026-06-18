// Components
import { login } from '@/routes';
import { Head } from '@inertiajs/react';

import TextLink from '@/components/text-link';
import AuthLayout from '@/layouts/auth-layout';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Forgot password"
            description="Password reset is managed through Active Directory"
        >
            <Head title="Forgot password" />

            <div className="space-y-6 text-center">
                <p className="text-sm text-muted-foreground">
                    Password reset is not available for Active Directory users.
                    Please contact your system administrator to reset your
                    password.
                </p>

                <div className="space-x-1 text-sm text-muted-foreground">
                    <span>Return to</span>
                    <TextLink href={login()}>log in</TextLink>
                </div>
            </div>
        </AuthLayout>
    );
}
