import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthSplitLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    const { name, quote } = usePage<SharedData>().props;

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            {/* <div className="absolute inset-0 bg-[url('/img/bglogin.png')] bg-cover bg-center">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-black/20 to-red-900/70"></div>
                <div className="absolute inset-0 bg-gradient-to-bl from-red-900/70 via-black/20 to-blue-900/80"></div>
            </div> */}
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
                <div className="absolute inset-0 bg-[url('/img/bglogin.png')] bg-cover bg-center bg-no-repeat" />
                <Link
                    href={home()}
                    className="relative z-20 flex items-center text-lg font-medium text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                >
                    <AppLogoIcon className="mr-2 size-8 fill-current text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                    {name}
                </Link>
                {quote && (
                    <div className="relative z-20 mt-auto">
                        <blockquote className="space-y-2">
                            <p className="text-lg">
                                &ldquo;{quote.message}&rdquo;
                            </p>
                            <footer className="text-sm text-neutral-300">
                                {quote.author}
                            </footer>
                        </blockquote>
                    </div>
                )}
            </div>
            <div className="w-full lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center lg:hidden"
                    >
                        <AppLogoIcon className="h-8 fill-current text-black sm:h-10" />
                    </Link>
                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="text-xl font-medium">{title}</h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
