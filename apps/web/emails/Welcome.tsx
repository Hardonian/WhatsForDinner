/**
 * Welcome Email Template
 * React Email template for onboarding D0
 */

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Img,
  Link,
  Preview,
} from '@react-email/components';

interface WelcomeEmailProps {
  userName?: string;
  baseUrl?: string;
}

export const WelcomeEmail = ({ userName = 'there', baseUrl = 'https://nomad.app' }: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Nomad - Your Personal Meal Planning Assistant</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img src={`${baseUrl}/logo.png`} width="120" height="40" alt="Nomad" />
          </Section>
          
          <Section style={content}>
            <Text style={heading}>Welcome to Nomad, {userName}! ??</Text>
            
            <Text style={paragraph}>
              We&apos;re excited to have you join our community of meal planners. Nomad helps you plan
              delicious, healthy meals that fit your lifestyle and dietary preferences.
            </Text>
            
            <Text style={paragraph}>
              Get started by creating your first meal plan:
            </Text>
            
            <Section style={buttonContainer}>
              <Button style={button} href={`${baseUrl}/app/meal-plan`}>
                Create Your First Plan
              </Button>
            </Section>
            
            <Text style={paragraph}>
              Or explore our curated recipe collection to discover new favorites.
            </Text>
            
            <Section style={features}>
              <Text style={featureTitle}>What you can do with Nomad:</Text>
              <Text style={featureItem}>? Plan meals for the whole week</Text>
              <Text style={featureItem}>? Get AI-powered recipe suggestions</Text>
              <Text style={featureItem}>? Track nutrition and health goals</Text>
              <Text style={featureItem}>? Share plans with your family</Text>
            </Section>
            
            <Text style={paragraph}>
              If you have any questions, our support team is here to help.
            </Text>
            
            <Text style={signature}>
              Happy meal planning,<br />
              The Nomad Team
            </Text>
          </Section>
          
          <Section style={footer}>
            <Text style={footerText}>
              You&apos;re receiving this email because you signed up for Nomad.
            </Text>
            <Link href={`${baseUrl}/unsubscribe`} style={footerLink}>
              Unsubscribe
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 24px',
  textAlign: 'center' as const,
  backgroundColor: '#1a1a1a',
};

const content = {
  padding: '0 24px',
};

const heading = {
  fontSize: '24px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#1a1a1a',
  margin: '24px 0',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#4a4a4a',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#0070f3',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const features = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const featureTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 16px 0',
};

const featureItem = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#4a4a4a',
  margin: '8px 0',
};

const signature = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#4a4a4a',
  margin: '32px 0 16px',
};

const footer = {
  borderTop: '1px solid #e5e7eb',
  padding: '24px',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '12px',
  lineHeight: '1.5',
  color: '#9ca3af',
  margin: '0 0 8px',
};

const footerLink = {
  fontSize: '12px',
  color: '#0070f3',
  textDecoration: 'underline',
};
