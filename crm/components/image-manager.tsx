'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Star, Trash2, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { uploadFile } from '@/lib/upload';
import { Button, Card } from '@/components/ui';

export function ImageManager({ propertyId }: { propertyId: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const key = ['property-images', propertyId];

  const { data: images } = useQuery({
    queryKey: key,
    queryFn: async () => (await api.GET('/api/properties/{id}/images', { params: { path: { id: propertyId } } })).data ?? [],
  });

  const refresh = () => qc.invalidateQueries({ queryKey: key });

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const { publicUrl, key: storageKey } = await uploadFile('properties', file);
        await api.POST('/api/properties/{id}/images', {
          params: { path: { id: propertyId } },
          body: { imageUrl: publicUrl, storageKey, isCover: false },
        });
      }
      refresh();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const setCover = useMutation({
    mutationFn: async (imageId: string) =>
      api.PATCH('/api/properties/{id}/images/{imageId}/cover', { params: { path: { id: propertyId, imageId } } }),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: async (imageId: string) =>
      api.DELETE('/api/properties/{id}/images/{imageId}', { params: { path: { id: propertyId, imageId } } }),
    onSuccess: refresh,
  });
  const reorder = useMutation({
    mutationFn: async (order: { id: string; sortOrder: number }[]) =>
      api.PATCH('/api/properties/{id}/images/reorder', { params: { path: { id: propertyId } }, body: { order } }),
    onSuccess: refresh,
  });

  const move = (index: number, dir: -1 | 1) => {
    if (!images) return;
    const next = [...images];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    reorder.mutate(next.map((img, i) => ({ id: img.id, sortOrder: i })));
  };

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Images ({images?.length ?? 0})</h3>
        <Button type="button" size="sm" variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Upload className="h-4 w-4" /> {uploading ? 'Uploading…' : 'Upload'}
        </Button>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
      </div>

      {!images?.length ? (
        <p className="text-sm text-gray-400">No images yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <div key={img.id} className="group relative overflow-hidden rounded-lg border border-gray-200">
              <img src={img.imageUrl} alt="" className="aspect-[4/3] w-full object-cover" />
              {img.isCover && (
                <span className="absolute left-2 top-2 rounded bg-gold px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                  COVER
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/50 p-1.5 opacity-0 transition group-hover:opacity-100">
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} className="rounded bg-white/20 p-1 text-white hover:bg-white/40" title="Move up">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} className="rounded bg-white/20 p-1 text-white hover:bg-white/40" title="Move down">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex gap-1">
                  {!img.isCover && (
                    <button type="button" onClick={() => setCover.mutate(img.id)} className="rounded bg-white/20 p-1 text-white hover:bg-white/40" title="Set cover">
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button type="button" onClick={() => remove.mutate(img.id)} className="rounded bg-white/20 p-1 text-white hover:bg-red-500" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
