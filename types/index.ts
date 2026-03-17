export interface Specialty {
  id: string
  name: string
  slug: string
}

export interface Diagnostician {
  id: string
  name: string
  slug: string
  photo_url: string | null
  bio: string | null
  city: string | null
  state: string | null
  zip: string | null
  lat: number | null
  lng: number | null
  service_area: string | null
  phone: string | null
  email: string | null
  website: string | null
  is_published: boolean
  created_at: string
  updated_at: string
  specialties?: Specialty[]
  email_recipients?: string[]
}

export interface Lead {
  id: string
  diagnostician_id: string | null
  diagnostician_name: string
  parent_name: string
  parent_email: string
  parent_phone: string
  child_age: number
  child_school: string | null
  child_concerns: string
  message: string | null
  created_at: string
}

export interface LeadFormData {
  diagnostician_id: string
  diagnostician_name: string
  parent_name: string
  parent_email: string
  parent_phone: string
  child_age: number
  child_school?: string
  child_concerns: string
  message?: string
  _hp: string
}
