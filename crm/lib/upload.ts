import { api } from './api';

/** Presign → direct PUT to storage → return the public URL + storage key. */
export async function uploadFile(folder: 'properties' | 'documents' | 'avatars', file: File) {
  const { data, error } = await api.POST('/api/uploads/sign', {
    body: { folder, filename: file.name, contentType: file.type },
  });
  if (error || !data) throw error ?? new Error('Could not get upload URL');

  const put = await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!put.ok) throw new Error('Upload failed');

  return { publicUrl: data.publicUrl, key: data.key };
}
