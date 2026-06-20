import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Keyboard, QrCode, ScanLine, X } from 'lucide-react';
import {
    type FormEvent,
    type RefObject,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

export type ScannableItem = {
    id: number;
    label: string;
    item_code?: string | null;
    barcode?: string | null;
};

type InventoryScannerProps<T extends ScannableItem> = {
    items: T[];
    onScan: (item: T) => void;
    contextLabel: string;
};

type BarcodeDetectorResult = {
    rawValue: string;
};

type BarcodeDetectorInstance = {
    detect: (source: HTMLVideoElement) => Promise<BarcodeDetectorResult[]>;
};

type BarcodeDetectorConstructor = new (options?: {
    formats?: string[];
}) => BarcodeDetectorInstance;

const scannerFormats = [
    'qr_code',
    'code_128',
    'code_39',
    'ean_13',
    'ean_8',
    'upc_a',
    'upc_e',
];

const code39Patterns: Record<string, string> = {
    '0': 'nnnwwnwnn',
    '1': 'wnnwnnnnw',
    '2': 'nnwwnnnnw',
    '3': 'wnwwnnnnn',
    '4': 'nnnwwnnnw',
    '5': 'wnnwwnnnn',
    '6': 'nnwwwnnnn',
    '7': 'nnnwnnwnw',
    '8': 'wnnwnnwnn',
    '9': 'nnwwnnwnn',
    A: 'wnnnnwnnw',
    B: 'nnwnnwnnw',
    C: 'wnwnnwnnn',
    D: 'nnnnwwnnw',
    E: 'wnnnwwnnn',
    F: 'nnwnwwnnn',
    G: 'nnnnnwwnw',
    H: 'wnnnnwwnn',
    I: 'nnwnnwwnn',
    J: 'nnnnwwwnn',
    K: 'wnnnnnnww',
    L: 'nnwnnnnww',
    M: 'wnwnnnnwn',
    N: 'nnnnwnnww',
    O: 'wnnnwnnwn',
    P: 'nnwnwnnwn',
    Q: 'nnnnnnwww',
    R: 'wnnnnnwwn',
    S: 'nnwnnnwwn',
    T: 'nnnnwnwwn',
    U: 'wwnnnnnnw',
    V: 'nwwnnnnnw',
    W: 'wwwnnnnnn',
    X: 'nwnnwnnnw',
    Y: 'wwnnwnnnn',
    Z: 'nwwnwnnnn',
    '-': 'nwnnnnwnw',
    '.': 'wwnnnnwnn',
    ' ': 'nwwnnnwnn',
    $: 'nwnwnwnnn',
    '/': 'nwnwnnnwn',
    '+': 'nwnnnwnwn',
    '%': 'nnnwnwnwn',
    '*': 'nwnnwnwnn',
};

export function generateInventoryCode(prefix = 'BC'): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomSegment = Math.random().toString(36).slice(2, 8).toUpperCase();

    return `${prefix}-${timestamp}-${randomSegment}`;
}

export function InventoryScanner<T extends ScannableItem>({
    items,
    onScan,
    contextLabel,
}: InventoryScannerProps<T>) {
    const [code, setCode] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const barcodeDetector = useMemo(() => {
        if (typeof window === 'undefined') {
            return null;
        }

        const Detector = (
            window as unknown as {
                BarcodeDetector?: BarcodeDetectorConstructor;
            }
        ).BarcodeDetector;

        return Detector ? new Detector({ formats: scannerFormats }) : null;
    }, []);

    function scanCode(scannedCode: string): boolean {
        const item = findScannedItem(items, scannedCode);

        if (!item) {
            setMessage(`No item found for ${scannedCode}.`);

            return false;
        }

        onScan(item);
        setCode('');
        setMessage(`${item.label} added to ${contextLabel}.`);
        inputRef.current?.focus();

        return true;
    }

    function submitScan(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (code.trim()) {
            scanCode(code);
        }
    }

    return (
        <div className="rounded-md border bg-muted/20 p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <form onSubmit={submitScan} className="min-w-0 flex-1">
                    <Label htmlFor={`${contextLabel}-scanner`}>
                        USB Barcode Scanner
                    </Label>
                    <div className="mt-2 flex gap-2">
                        <Input
                            ref={inputRef}
                            id={`${contextLabel}-scanner`}
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                            placeholder="Scan or enter item code"
                        />
                        <Button type="submit" variant="outline">
                            <Keyboard className="size-4" />
                            Scan
                        </Button>
                    </div>
                </form>
                <Button
                    type="button"
                    variant={isCameraOpen ? 'secondary' : 'outline'}
                    onClick={() => {
                        setCameraError(null);
                        setIsCameraOpen((current) => !current);
                    }}
                >
                    {isCameraOpen ? (
                        <X className="size-4" />
                    ) : (
                        <Camera className="size-4" />
                    )}
                    Mobile Camera Scanner
                </Button>
            </div>

            {message && (
                <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            )}
            {cameraError && (
                <p className="mt-2 text-sm text-destructive">{cameraError}</p>
            )}

            {isCameraOpen && (
                <CameraScanner
                    barcodeDetector={barcodeDetector}
                    videoRef={videoRef}
                    onCode={(scannedCode) => {
                        if (scanCode(scannedCode)) {
                            setIsCameraOpen(false);
                        }
                    }}
                    onError={setCameraError}
                />
            )}
        </div>
    );
}

function CameraScanner({
    barcodeDetector,
    videoRef,
    onCode,
    onError,
}: {
    barcodeDetector: BarcodeDetectorInstance | null;
    videoRef: RefObject<HTMLVideoElement | null>;
    onCode: (code: string) => void;
    onError: (message: string) => void;
}) {
    useEffect(() => {
        let stream: MediaStream | null = null;
        let animationFrame = 0;
        let isActive = true;

        async function startCamera() {
            if (!barcodeDetector) {
                onError('Camera scanning is not supported by this browser.');

                return;
            }

            if (!navigator.mediaDevices?.getUserMedia) {
                onError('Camera access is not available on this device.');

                return;
            }

            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' },
                });

                if (!videoRef.current) {
                    return;
                }

                videoRef.current.srcObject = stream;
                await videoRef.current.play();

                const scanFrame = async () => {
                    if (!isActive || !videoRef.current) {
                        return;
                    }

                    const results = await barcodeDetector.detect(
                        videoRef.current,
                    );
                    const rawValue = results[0]?.rawValue;

                    if (rawValue) {
                        onCode(rawValue);

                        return;
                    }

                    animationFrame = window.requestAnimationFrame(scanFrame);
                };

                animationFrame = window.requestAnimationFrame(scanFrame);
            } catch {
                onError('Camera permission was denied or unavailable.');
            }
        }

        void startCamera();

        return () => {
            isActive = false;
            window.cancelAnimationFrame(animationFrame);
            stream?.getTracks().forEach((track) => track.stop());
        };
    }, [barcodeDetector, onCode, onError, videoRef]);

    return (
        <div className="mt-3 overflow-hidden rounded-md border bg-black">
            <video
                ref={videoRef}
                className="aspect-video w-full object-cover"
                muted
                playsInline
            />
        </div>
    );
}

export function BarcodeQrPreview({ value }: { value: string }) {
    const normalizedValue = normalizeCode39(value);

    if (!normalizedValue) {
        return (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Generate or enter a barcode value to preview printable codes.
            </div>
        );
    }

    return (
        <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <ScanLine className="size-4" />
                    Barcode
                </div>
                <Code39Barcode value={normalizedValue} />
            </div>
            <div className="rounded-md border p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <QrCode className="size-4" />
                    QR Code
                </div>
                <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(value)}`}
                    alt={`QR code for ${value}`}
                    className="mx-auto aspect-square h-24 rounded bg-white p-1"
                />
            </div>
        </div>
    );
}

function findScannedItem<T extends ScannableItem>(
    items: T[],
    scannedCode: string,
): T | undefined {
    const normalizedScannedCode = normalizeMatchValue(scannedCode);

    return items.find((item) => {
        const labelCode = item.label.split(' - ')[0] ?? item.label;
        const candidates = [item.barcode, item.item_code, labelCode];

        return candidates.some(
            (candidate) =>
                candidate &&
                normalizeMatchValue(candidate) === normalizedScannedCode,
        );
    });
}

function normalizeMatchValue(value: string): string {
    return value.trim().toUpperCase();
}

function normalizeCode39(value: string): string {
    return value
        .trim()
        .toUpperCase()
        .replace(/_/g, '-')
        .split('')
        .filter((character) => code39Patterns[character])
        .join('');
}

function Code39Barcode({ value }: { value: string }) {
    const encodedValue = `*${value}*`;
    const bars = buildCode39Bars(encodedValue);
    const width = bars.at(-1)?.x ?? 1;

    return (
        <svg
            viewBox={`0 0 ${width} 80`}
            className="h-24 w-full rounded bg-white text-black"
            role="img"
            aria-label={`Barcode for ${value}`}
        >
            {bars
                .filter((bar) => bar.isBar)
                .map((bar, index) => (
                    <rect
                        key={`${bar.x}-${index}`}
                        x={bar.x}
                        y="8"
                        width={bar.width}
                        height="48"
                        fill="currentColor"
                    />
                ))}
            <text
                x={width / 2}
                y="72"
                textAnchor="middle"
                className="fill-current text-[10px]"
            >
                {value}
            </text>
        </svg>
    );
}

function buildCode39Bars(value: string): {
    x: number;
    width: number;
    isBar: boolean;
}[] {
    let x = 0;
    const bars: { x: number; width: number; isBar: boolean }[] = [];

    value.split('').forEach((character) => {
        const pattern = code39Patterns[character] ?? code39Patterns['-'];

        pattern.split('').forEach((part, index) => {
            const width = part === 'w' ? 3 : 1;

            bars.push({ x, width, isBar: index % 2 === 0 });
            x += width;
        });

        x += 1;
    });

    return [...bars, { x, width: 0, isBar: false }];
}
