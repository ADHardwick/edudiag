import {
  Html, Head, Body, Container, Heading, Text, Hr, Link, Section
} from '@react-email/components'

interface LeadNotificationProps {
  diagnosticianName: string
  parentName: string
  parentEmail: string
  parentPhone: string
  childAge: number
  childSchool?: string
  childConcerns: string
  message?: string
  adminLeadUrl: string
}

export function LeadNotification({
  diagnosticianName, parentName, parentEmail, parentPhone,
  childAge, childSchool, childConcerns, message, adminLeadUrl,
}: LeadNotificationProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#f8f9fa' }}>
        <Container style={{ background: '#fff', padding: '32px', borderRadius: '8px', maxWidth: '600px', margin: '40px auto' }}>
          <Heading style={{ color: '#1e3a5f', fontSize: '20px', marginBottom: '8px' }}>
            New Inquiry for {diagnosticianName}
          </Heading>
          <Hr />
          <Section>
            <Text><strong>Parent/Guardian:</strong> {parentName}</Text>
            <Text><strong>Email:</strong> {parentEmail}</Text>
            <Text><strong>Phone:</strong> {parentPhone}</Text>
            <Text><strong>Child&apos;s Age:</strong> {childAge}</Text>
            {childSchool && <Text><strong>Child&apos;s School:</strong> {childSchool}</Text>}
            <Text><strong>Concerns:</strong> {childConcerns}</Text>
            {message && <Text><strong>Message:</strong> {message}</Text>}
          </Section>
          <Hr />
          <Link href={adminLeadUrl} style={{ color: '#1e3a5f' }}>View in admin panel</Link>
        </Container>
      </Body>
    </Html>
  )
}
