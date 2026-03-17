import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const oldUrl = formData.get('oldUrl') as string | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'File must be JPEG, PNG, or WebP' }, { status: 400 })
  }
  const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File size must not exceed 5 MB' }, { status: 400 })
  }

  // Delete old file if replacing
  if (oldUrl) {
    let oldPath: string | undefined
    try {
      oldPath = new URL(oldUrl).pathname.split('/diagnostician-photos/')[1]
    } catch {
      oldPath = undefined
    }
    if (oldPath) {
      await supabase.storage.from('diagnostician-photos').remove([oldPath])
    }
  }

  const ext = file.name.split('.').pop()
  const filename = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('diagnostician-photos')
    .upload(filename, file, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage
    .from('diagnostician-photos')
    .getPublicUrl(filename)

  return NextResponse.json({ url: publicUrl })
}
