import HeadingSmall from '@/components/heading-small';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { disable, enable, show } from '@/routes/two-factor';
import { type BreadcrumbItem } from '@/types';
import { Form, Head } from '@inertiajs/react';
import { Shield, ShieldBan, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface TwoFactorProps {
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Two-Factor Authentication',
        href: show.url(),
    },
];

export default function TwoFactor({
    requiresConfirmation = false,
    twoFactorEnabled = false,
}: TwoFactorProps) {
    const {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors,
    } = useTwoFactorAuth();
    const [showSetupModal, setShowSetupModal] = useState<boolean>(false);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Two-Factor Authentication" />
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Two-Factor Authentication"
                        description="Protect your account using an authenticator app and backup recovery codes"
                    />

                    <Card className="border-border bg-card/90">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Shield className="size-4" /> Security Overview
                            </CardTitle>
                            <CardDescription>
                                Two-factor authentication adds a second
                                verification step during login.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 text-sm text-muted-foreground">
                                <p>
                                    1. Enable 2FA and scan the QR code with your
                                    authenticator app.
                                </p>
                                <p>
                                    2. Confirm setup with a 6-digit code from
                                    your app.
                                </p>
                                <p>
                                    3. Save your recovery codes in a secure
                                    password manager.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {twoFactorEnabled ? (
                        <Card className="border-border bg-emerald-50/70 dark:bg-emerald-950/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <ShieldCheck className="size-4 text-emerald-600" />
                                    Two-Factor Authentication is Enabled
                                </CardTitle>
                                <CardDescription>
                                    Your account now requires a one-time code
                                    from your authenticator app.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Badge variant="default">Enabled</Badge>

                                <p className="text-sm text-muted-foreground">
                                    Keep your recovery codes safe. They are
                                    required if your phone is lost or
                                    unavailable.
                                </p>

                                <TwoFactorRecoveryCodes
                                    recoveryCodesList={recoveryCodesList}
                                    fetchRecoveryCodes={fetchRecoveryCodes}
                                    errors={errors}
                                />

                                <div className="relative inline">
                                    <Form {...disable.form()}>
                                        {({ processing }) => (
                                            <Button
                                                variant="destructive"
                                                type="submit"
                                                disabled={processing}
                                            >
                                                <ShieldBan /> Disable 2FA
                                            </Button>
                                        )}
                                    </Form>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-border bg-amber-50/70 dark:bg-amber-950/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <ShieldBan className="size-4 text-amber-600" />
                                    Two-Factor Authentication is Disabled
                                </CardTitle>
                                <CardDescription>
                                    Enable 2FA to require a verification code
                                    when signing in.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Badge variant="destructive">Disabled</Badge>
                                <p className="text-sm text-muted-foreground">
                                    Recommended for administrators and ticket
                                    handlers to reduce account takeover risk.
                                </p>

                                <div>
                                    {hasSetupData ? (
                                        <Button
                                            onClick={() =>
                                                setShowSetupModal(true)
                                            }
                                        >
                                            <ShieldCheck />
                                            Continue Setup
                                        </Button>
                                    ) : (
                                        <Form
                                            {...enable.form()}
                                            onSuccess={() =>
                                                setShowSetupModal(true)
                                            }
                                        >
                                            {({ processing }) => (
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                >
                                                    <ShieldCheck />
                                                    Enable 2FA
                                                </Button>
                                            )}
                                        </Form>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <TwoFactorSetupModal
                        isOpen={showSetupModal}
                        onClose={() => setShowSetupModal(false)}
                        requiresConfirmation={requiresConfirmation}
                        twoFactorEnabled={twoFactorEnabled}
                        qrCodeSvg={qrCodeSvg}
                        manualSetupKey={manualSetupKey}
                        clearSetupData={clearSetupData}
                        fetchSetupData={fetchSetupData}
                        errors={errors}
                    />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
