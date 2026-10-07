/**
 * Premium Upsell Email Template
 */

import { Html, Head, Body, Container, Section, Text, Button, Img, Link, Preview } from '@react-email/components';

interface PremiumUpsellEmailProps {
  userName?: string;
  baseUrl?: string;
  offerType?: 'trial' | 'discount';
  offerValue?: number;
}

export const PremiumUpsellEmail = ({
  userName = 'there',
  baseUrl = 'https://nomad.app',
  offerType = 'trial',
  offerValue = 7,
}: PremiumUpsellEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Unlock Premium Features</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img src={`${baseUrl}/logo.png`} width="120" height="40" alt="Nomad" />
          </Section>
          <Section style={content}>
            <Text style={heading}>Unlock Premium Features, {userName}</Text>
            <Text style={paragraph}>
              You&apos;ve been creating amazing meal plans! Upgrade to Premium to unlock unlimited plans,
              AI-powered suggestions, and family sharing.
            </Text>
            {offerType === 'trial' && (
              <Text style={highlight}>Start your {offerValue}-day free trial today!</Text>
            )}
            <Section style={buttonContainer}>
              <Button style={button} href={`${baseUrl}/app/paywall`}>
                Start Free Trial
              </Button>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PremiumUpsellEmail;

const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', maxWidth: '600px' };
const header = { padding: '32px 24px', textAlign: 'center' as const, backgroundColor: '#1a1a1a' };
const content = { padding: '0 24px' };
const heading = { fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: '24px 0' };
const paragraph = { fontSize: '16px', lineHeight: '1.6', color: '#4a4a4a', margin: '16px 0' };
const highlight = { fontSize: '18px', fontWeight: '600', color: '#0070f3', margin: '24px 0' };
const buttonContainer = { textAlign: 'center' as const, margin: '32px 0' };
const button = {
  backgroundColor: '#0070f3',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
  padding: '12px 24px',
};
