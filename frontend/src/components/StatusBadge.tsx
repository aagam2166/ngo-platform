type Status =
    | 'PENDING'
    | 'UNDER_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED';

const STATUS_STYLES: Record<Status, { bg: string; text: string; label: string }> = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
    UNDER_REVIEW: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Under Review' },
    APPROVED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
    IN_PROGRESS: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'In Progress' },
    COMPLETED: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed' },
    CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Cancelled' },
};

export default function StatusBadge({ status }: { status: string }) {
    const style = STATUS_STYLES[status as Status] ?? {
        bg: 'bg-gray-100',
        text: 'text-gray-500',
        label: status,
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
            {style.label}
        </span>
    );
}