'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import type { LeaseCompWithBuilding, LeaseCompFile } from '@/lib/types/lease-comps'
import { logLeaseCompEvent } from '@/lib/api/lease-comp-history'

interface FilesTabProps {
  comp: LeaseCompWithBuilding
  userId: string
  teamId: string
  files: LeaseCompFile[]
}

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function FilesTab({ comp, userId, teamId, files }: FilesTabProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const fileId = crypto.randomUUID()
      const storagePath = `${teamId}/${comp.id}/${fileId}-${file.name}`

      // 1. Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('lease-comp-files')
        .upload(storagePath, file)

      if (uploadError) throw new Error(uploadError.message)

      // 2. Insert metadata row
      const { error: insertError } = await supabase
        .from('lease_comp_files')
        .insert({
          lease_comp_id: comp.id,
          team_id: teamId,
          storage_path: storagePath,
          original_filename: file.name,
          mime_type: file.type || null,
          size_bytes: file.size,
          created_by: userId,
        })

      if (insertError) throw new Error(insertError.message)

      // 3. Log history event
      await logLeaseCompEvent(supabase, {
        leaseCompId: comp.id,
        teamId,
        eventType: 'file_added',
        summary: `File added: "${file.name}"`,
        actorUserId: userId,
      })

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
    } finally {
      setUploading(false)
      // Reset the input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDownload = async (file: LeaseCompFile) => {
    try {
      const { data, error: urlError } = await supabase.storage
        .from('lease-comp-files')
        .createSignedUrl(file.storage_path, 60)

      if (urlError || !data?.signedUrl) {
        setError('Failed to generate download link')
        return
      }

      window.open(data.signedUrl, '_blank')
    } catch {
      setError('Failed to download file')
    }
  }

  const handleDelete = async (file: LeaseCompFile) => {
    if (!confirm(`Delete "${file.original_filename}"?`)) return

    setError(null)

    try {
      // 1. Remove from storage
      const { error: storageError } = await supabase.storage
        .from('lease-comp-files')
        .remove([file.storage_path])

      if (storageError) throw new Error(storageError.message)

      // 2. Delete metadata row
      const { error: deleteError } = await supabase
        .from('lease_comp_files')
        .delete()
        .eq('id', file.id)

      if (deleteError) throw new Error(deleteError.message)

      // 3. Log history event
      await logLeaseCompEvent(supabase, {
        leaseCompId: comp.id,
        teamId,
        eventType: 'file_removed',
        summary: `File removed: "${file.original_filename}"`,
        actorUserId: userId,
      })

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file')
    }
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Files</h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {files.length > 0 ? (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="pb-2 font-medium">Filename</th>
              <th className="pb-2 font-medium">Size</th>
              <th className="pb-2 font-medium">Uploaded</th>
              <th className="pb-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id} className="border-b border-gray-100">
                <td className="py-3 text-gray-900">{file.original_filename}</td>
                <td className="py-3 text-gray-600">{formatFileSize(file.size_bytes)}</td>
                <td className="py-3 text-gray-600">{formatRelativeTime(file.created_at)}</td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => handleDownload(file)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Download
                  </button>
                  {file.created_by === userId && (
                    <button
                      onClick={() => handleDelete(file)}
                      className="ml-3 text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-4 text-sm text-gray-500">No files yet. Upload a file to get started.</p>
      )}
    </div>
  )
}
