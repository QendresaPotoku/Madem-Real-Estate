'use client';

import { Pencil, Trash2 } from 'lucide-react';

export function RowActions({
  onEdit,
  onDelete,
  confirmLabel = 'Delete this record?',
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  confirmLabel?: string;
}) {
  return (
    <div className="flex justify-end gap-1">
      {onEdit && (
        <button onClick={onEdit} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand" title="Edit">
          <Pencil className="h-4 w-4" />
        </button>
      )}
      {onDelete && (
        <button
          onClick={() => {
            if (window.confirm(confirmLabel)) onDelete();
          }}
          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
