import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const oldUrl = formData.get('oldUrl') as string | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // Delete old file if replacing
  if (oldUrl) {
    const oldPath = oldUrl.split('/diagnostician-photos/')[1]
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
