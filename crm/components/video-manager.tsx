'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Trash2, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { uploadFile } from '@/lib/upload';
import { Button, Card } from '@/components/ui';

export function VideoManager({ propertyId }: { propertyId: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const key = ['property-videos', propertyId];

  const { data: videos } = useQuery({
    queryKey: key,
    queryFn: async () => (await api.GET('/api/properties/{id}/videos', { params: { path: { id: propertyId } } })).data ?? [],
  });

  const refresh = () => qc.invalidateQueries({ queryKey: key });

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const { publicUrl, key: storageKey } = await uploadFile('properties', file);
        await api.POST('/api/properties/{id}/videos', {
          params: { path: { id: propertyId } },
          body: { videoUrl: publicUrl, storageKey },
        });
      }
      refresh();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const remove = useMutation({
    mutationFn: async (videoId: string) =>
      api.DELETE('/api/properties/{id}/videos/{videoId}', { params: { path: { id: propertyId, videoId } } }),
    onSuccess: refresh,
  });
  const reorder = useMutation({
    mutationFn: async (order: { id: string; sortOrder: number }[]) =>
      api.PATCH('/api/properties/{id}/videos/reorder', { params: { path: { id: propertyId } }, body: { order } }),
    onSuccess: refresh,
  });

  const move = (index: number, dir: -1 | 1) => {
    if (!videos) return;
    const next = [...videos];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    reorder.mutate(next.map((vid, i) => ({ id: vid.id, sortOrder: i })));
  };

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Videos ({videos?.length ?? 0})</h3>
        <Button type="button" size="sm" variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Upload className="h-4 w-4" /> {uploading ? 'Uploading…' : 'Upload'}
        </Button>
        <input ref={fileRef} type="file" accept="video/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
      </div>

      {!videos?.length ? (
        <p className="text-sm text-gray-400">No videos yet. The first video plays on hover on the website.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {videos.map((vid, i) => (
            <div key={vid.id} className="group relative overflow-hidden rounded-lg border border-gray-200 bg-black">
              <video src={vid.videoUrl} className="aspect-[4/3] w-full object-cover" muted playsInline preload="metadata" controls />
              {i === 0 && (
                <span className="pointer-events-none absolute left-2 top-2 rounded bg-gold px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                  HOVER PREVIEW
                </span>
              )}
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                <button type="button" onClick={() => move(i, -1)} className="rounded bg-black/50 p-1 text-white hover:bg-black/70" title="Move up">
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => move(i, 1)} className="rounded bg-black/50 p-1 text-white hover:bg-black/70" title="Move down">
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => remove.mutate(vid.id)} className="rounded bg-black/50 p-1 text-white hover:bg-red-500" title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
