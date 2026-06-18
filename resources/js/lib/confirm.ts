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
