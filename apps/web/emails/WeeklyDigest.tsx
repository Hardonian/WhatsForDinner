/**
 * Weekly Digest Email Template
 * React Email template for weekly summaries
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
  Row,
  Column,
} from '@react-email/components';

interface WeeklyDigestEmailProps {
  userName?: string;
  baseUrl?: string;
  mealPlans?: Array<{
    day: string;
    recipes: Array<{ name: string; image?: string }>;
  }>;
  tips?: string[];
}

export const WeeklyDigestEmail = ({
  userName = 'there',
  baseUrl = 'https://nomad.app',
  mealPlans = [],
  tips = [],
}: WeeklyDigestEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Weekly Meal Planning Digest</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img src={`${baseUrl}/logo.png`} width="120" height="40" alt="Nomad" />
          </Section>
          
          <Section style={content}>
            <Text style={heading}>Your Weekly Meal Planning Digest</Text>
            
            <Text style={paragraph}>
              Hi {userName}, here&apos;s a summary of your meal planning activity this week.
            </Text>
            
            {mealPlans.length > 0 && (
              <Section style={plansSection}>
                <Text style={sectionTitle}>Your Meal Plans This Week</Text>
                {mealPlans.map((plan, idx) => (
                  <Section key={idx} style={planCard}>
                    <Text style={planDay}>{plan.day}</Text>
                    {plan.recipes.map((recipe, rIdx) => (
                      <Row key={rIdx}>
                        <Column>
                          <Text style={recipeName}>{recipe.name}</Text>
                        </Column>
                      </Row>
                    ))}
                  </Section>
                ))}
              </Section>
            )}
            
            {tips.length > 0 && (
              <Section style={tipsSection}>
                <Text style={sectionTitle}>Planning Tips</Text>
                {tips.map((tip, idx) => (
                  <Text key={idx} style={tipItem}>
                    ? {tip}
                  </Text>
                ))}
              </Section>
            )}
            
            <Section style={buttonContainer}>
              <Button style={button} href={`${baseUrl}/app/meal-plan`}>
                Plan Next Week
              </Button>
            </Section>
            
            <Text style={signature}>
              Keep up the great work!<br />
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

export default WeeklyDigestEmail;

// Styles (reuse from Welcome.tsx)
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

const plansSection = {
  margin: '32px 0',
};

const sectionTitle = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 16px',
};

const planCard = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '16px',
  margin: '12px 0',
};

const planDay = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 8px',
};

const recipeName = {
  fontSize: '14px',
  color: '#4a4a4a',
  margin: '4px 0',
};

const tipsSection = {
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const tipItem = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#4a4a4a',
  margin: '8px 0',
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
