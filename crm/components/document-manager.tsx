'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FileText, Trash2, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { uploadFile } from '@/lib/upload';
import { useDocumentTypes } from '@/lib/queries';
import { Button, Card, Select, StatusBadge } from '@/components/ui';

const DOC_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  VERIFIED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
};
const STATUSES = ['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'] as const;

export function DocumentManager({ propertyId }: { propertyId: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docTypeId, setDocTypeId] = useState('');
  const [uploading, setUploading] = useState(false);
  const docTypes = useDocumentTypes();
  const key = ['property-documents', propertyId];

  const { data: docs } = useQuery({
    queryKey: key,
    queryFn: async () => (await api.GET('/api/properties/{id}/documents', { params: { path: { id: propertyId } } })).data ?? [],
  });
  const refresh = () => qc.invalidateQueries({ queryKey: key });

  const onFile = async (files: FileList | null) => {
    if (!files?.length || !docTypeId) return;
    setUploading(true);
    try {
      const { publicUrl, key: storageKey } = await uploadFile('documents', files[0]);
      await api.POST('/api/properties/{id}/documents', {
        params: { path: { id: propertyId } },
        body: { documentTypeId: Number(docTypeId), fileUrl: publicUrl, storageKey },
      });
      refresh();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const setStatus = useMutation({
    mutationFn: async ({ docId, status }: { docId: string; status: string }) =>
      api.PATCH('/api/properties/{id}/documents/{docId}', {
        params: { path: { id: propertyId, docId } },
        body: { status: status as 'VERIFIED' },
      }),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: async (docId: string) =>
      api.DELETE('/api/properties/{id}/documents/{docId}', { params: { path: { id: propertyId, docId } } }),
    onSuccess: refresh,
  });

  const openDoc = async (docId: string) => {
    const { data } = await api.GET('/api/properties/{id}/documents/{docId}/url', {
      params: { path: { id: propertyId, docId } },
    });
    if (data?.url) window.open(data.url, '_blank');
  };

  const typeLabel = (id: number) => docTypes.data?.find((t) => t.id === id)?.labelJson.en ?? `#${id}`;

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-700">Documents ({docs?.length ?? 0})</h3>
        <div className="flex items-center gap-2">
          <Select value={docTypeId} onChange={(e) => setDocTypeId(e.target.value)} className="w-48">
            <option value="">Document type…</option>
            {docTypes.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.labelJson.en}
              </option>
            ))}
          </Select>
          <Button size="sm" variant="secondary" disabled={!docTypeId || uploading} onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> {uploading ? 'Uploading…' : 'Upload'}
          </Button>
          <input ref={fileRef} type="file" accept="application/pdf,image/*" hidden onChange={(e) => onFile(e.target.files)} />
        </div>
      </div>

      {!docs?.length ? (
        <p className="text-sm text-gray-400">No documents yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="flex items-center gap-2 text-gray-700">
                <FileText className="h-4 w-4 text-gray-400" /> {typeLabel(d.documentTypeId)}
              </span>
              <div className="flex items-center gap-2">
                <StatusBadge value={d.status} map={DOC_STATUS_STYLES} />
                <Select
                  value={d.status}
                  onChange={(e) => setStatus.mutate({ docId: d.id, status: e.target.value })}
                  className="w-32 py-1 text-xs"
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
                <button onClick={() => openDoc(d.id)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-brand" title="Open">
                  <Download className="h-4 w-4" />
                </button>
                <button onClick={() => remove.mutate(d.id)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
