import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(
    props: ImgHTMLAttributes<HTMLImageElement>,
) {
    return (
        <img
            {...props}
            src="/img/logo.png"
            alt="StockMaster Logo"
            style={{ maxWidth: '100%', height: 'auto', ...props.style }}
        />
    );
}
