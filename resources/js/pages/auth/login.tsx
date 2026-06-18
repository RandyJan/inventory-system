import InputError from '@/components/input-error';
import { Turnstile } from '@/components/turnstile';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import PrivacyNoticeDialog from '@/components/privacy-notice/privacy-notice-dialog';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/login';
import { Form, Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface LoginProps {
    readonly status?: string;
    readonly canResetPassword: boolean;
    readonly canRegister: boolean;
    readonly turnstileSiteKey: string;
}

export default function Login({ status, turnstileSiteKey }: LoginProps) {
    const [turnstileToken, setTurnstileToken] = useState<string>('');
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [privacyDialogOpen, setPrivacyDialogOpen] = useState(true);

    useEffect(() => {
        setPrivacyDialogOpen(true);
    }, []);

    return (
        <AuthLayout
            title="Log in to your account"
            description="Enter your Active Directory username and password below to log in"
        >
            <Head title="Log in" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-4"
            >
                {({ processing, errors }) => (
                    <>
                        {/* Account Type Information */}
                        <div className="rounded-md bg-blue-50 p-3 text-sm dark:bg-blue-950">
                            <p className="font-semibold text-blue-900 dark:text-blue-100">
                                Active Directory Account Required
                            </p>
                            <p className="mt-1 text-blue-800 dark:text-blue-200">
                                Please use your Active Directory credentials to log in. If you don't have an Active Directory account or need assistance, 
                                please contact your system administrator.
                            </p>
                        </div>

                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="samaccountname">Username</Label>
                                <Input
                                    id="samaccountname"
                                    type="text"
                                    name="samaccountname"
                                    required
                                    autoFocus
                                    autoComplete="username"
                                    placeholder="username"
                                />
                                <InputError message={errors.samaccountname} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    autoComplete="current-password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            {/* Centered Turnstile */}
                            <div className="flex flex-col items-center gap-2">
                                <Turnstile
                                    siteKey={turnstileSiteKey}
                                    onVerify={setTurnstileToken}
                                />
                                <input
                                    type="hidden"
                                    name="cf-turnstile-response"
                                    value={turnstileToken}
                                />
                                <InputError
                                    message={errors['cf-turnstile-response']}
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex items-start space-x-3">
                                    <Checkbox 
                                        id="remember" 
                                        name="remember"
                                        className="mt-1"
                                    />
                                    <Label htmlFor="remember" className="font-normal">
                                        Remember me
                                    </Label>
                                </div>

                                {/* Privacy Notice Acceptance */}
                                <div className="flex items-start space-x-3">
                                    <Checkbox 
                                        id="privacy-accepted" 
                                        checked={privacyAccepted}
                                        onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
                                        className="mt-1"
                                        required
                                    />
                                    <div className="flex flex-col gap-1">
                                        <Label htmlFor="privacy-accepted" className="font-normal">
                                            I acknowledge and accept the{' '}
                                            <PrivacyNoticeDialog 
                                                trigger="Privacy Notice" 
                                                triggerClassName="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium"
                                                open={privacyDialogOpen}
                                                onOpenChange={setPrivacyDialogOpen}
                                                onAccept={() => setPrivacyAccepted(true)}
                                            />
                                        </Label>
                                        <InputError message={errors['privacy-accepted']} />
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                disabled={processing || !turnstileToken || !privacyAccepted}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
