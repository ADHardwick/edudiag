import { Resend } from 'resend'
import { render } from '@react-email/components'
import { LeadNotification } from '@/emails/LeadNotification'

interface LeadEmailPayload {
  diagnosticianName: string
  parentName: string
  parentEmail: string
  parentPhone: string
  childAge: number
  childSchool?: string
  childConcerns: string
  message?: string
  leadId: string
}

export async function sendLeadEmails(recipients: string[], payload: LeadEmailPayload) {
  // Construct client inside the function so tests can override the Resend mock per-call
  const resend = new Resend(process.env.RESEND_API_KEY!)
  const adminLeadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/leads/${payload.leadId}`
  // `render()` is async in @react-email/render v2+; must be awaited
  const html = await render(LeadNotification({ ...payload, adminLeadUrl }))

  const sends = recipients.map((to) =>
    resend.emails.send({
      from: 'Directory <noreply@yourdomain.com>',
      to,
      subject: `New Inquiry for ${payload.diagnosticianName}`,
      html,
    })
  )

  await Promise.allSettled(sends)
}
