import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export async function confirmArchiveItem(itemName: string): Promise<boolean> {
    const result = await Swal.fire({
        title: 'Archive item?',
        text: `${itemName} will be hidden from active item lists, but its record will be preserved.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Archive',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        focusCancel: true,
        confirmButtonColor: '#dc2626',
    });

    return result.isConfirmed;
}

export async function promptText({
    title,
    label,
    placeholder,
    required = false,
    confirmButtonText = 'Continue',
}: {
    title: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
    confirmButtonText?: string;
}): Promise<string | null> {
    const result = await Swal.fire<string>({
        title,
        input: 'textarea',
        inputLabel: label,
        inputPlaceholder: placeholder,
        inputAttributes: {
            rows: '4',
        },
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        focusCancel: !required,
        inputValidator: (value) => {
            if (required && !value?.trim()) {
                return 'This field is required.';
            }
        },
    });

    if (!result.isConfirmed) {
        return null;
    }

    return result.value?.trim() ?? '';
}
