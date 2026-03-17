import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Resend before importing email module
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ id: 'mock-id' }) },
  })),
}))

// Mock @react-email/components (render is re-exported from there)
vi.mock('@react-email/components', () => ({
  render: vi.fn().mockResolvedValue('<html>mock email</html>'),
  Html: () => null,
  Head: () => null,
  Body: () => null,
  Container: () => null,
  Heading: () => null,
  Text: () => null,
  Hr: () => null,
  Link: () => null,
  Section: () => null,
}))

import { sendLeadEmails } from '@/lib/email'
import { Resend } from 'resend'

describe('sendLeadEmails', () => {
  const payload = {
    diagnosticianName: 'Jane Smith',
    parentName: 'John Parent',
    parentEmail: 'parent@test.com',
    parentPhone: '555-1234',
    childAge: 8,
    childConcerns: 'Reading difficulties',
    leadId: 'lead-abc',
  }

  beforeEach(() => { vi.clearAllMocks() })

  it('sends one email per recipient', async () => {
    const mockSend = vi.fn().mockResolvedValue({ id: 'id' })
    ;(Resend as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      emails: { send: mockSend },
    }))

    await sendLeadEmails(['admin@test.com', 'extra@test.com'], payload)
    expect(mockSend).toHaveBeenCalledTimes(2)
  })

  it('uses the correct email subject', async () => {
    const mockSend = vi.fn().mockResolvedValue({ id: 'id' })
    ;(Resend as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      emails: { send: mockSend },
    }))

    await sendLeadEmails(['admin@test.com'], payload)
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'New Inquiry for Jane Smith' })
    )
  })

  it('does not throw if a send fails', async () => {
    const mockSend = vi.fn().mockRejectedValue(new Error('Resend error'))
    ;(Resend as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      emails: { send: mockSend },
    }))

    await expect(sendLeadEmails(['admin@test.com'], payload)).resolves.not.toThrow()
  })
})
