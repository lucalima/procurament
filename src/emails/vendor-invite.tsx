import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export interface VendorInviteEmailProps {
  orgName: string
  rfpTitle: string
  submissionDeadline: string | null
  personalMessage: string | null
  inviteUrl: string
}

// Emails cannot use the app's CSS variables, so this template uses inline
// styles; the values mirror the light-mode design tokens.
const styles = {
  body: { backgroundColor: '#f8fafc', fontFamily: 'Inter, Arial, sans-serif' },
  container: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    margin: '32px auto',
    padding: '24px',
    maxWidth: '560px',
  },
  heading: { color: '#0f172a', fontSize: '24px', margin: '0 0 16px' },
  text: { color: '#0f172a', fontSize: '14px', lineHeight: '1.5' },
  muted: { color: '#64748b', fontSize: '12px', lineHeight: '1.5' },
  quote: {
    borderLeft: '3px solid #e2e8f0',
    color: '#0f172a',
    fontSize: '14px',
    margin: '16px 0',
    padding: '4px 12px',
  },
  button: {
    backgroundColor: '#1d4ed8',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 500,
    padding: '10px 16px',
    textDecoration: 'none',
  },
}

/** Sent when a PM invites a vendor to an RFP (Tech Stack §9.2). */
export default function VendorInviteEmail({
  orgName,
  rfpTitle,
  submissionDeadline,
  personalMessage,
  inviteUrl,
}: VendorInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`${orgName} invited you to respond to ${rfpTitle}`}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>
            You have been invited to an RFP
          </Heading>
          <Text style={styles.text}>
            {orgName} has invited you to submit a proposal for{' '}
            <strong>{rfpTitle}</strong>.
          </Text>
          {submissionDeadline && (
            <Text style={styles.text}>
              Submission deadline: {submissionDeadline}
            </Text>
          )}
          {personalMessage && (
            <Text style={styles.quote}>{personalMessage}</Text>
          )}
          <Section style={{ margin: '24px 0' }}>
            <Button href={inviteUrl} style={styles.button}>
              Accept Invite
            </Button>
          </Section>
          <Text style={styles.muted}>
            This invite link is valid for 72 hours. If you were not expecting
            it, you can ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
