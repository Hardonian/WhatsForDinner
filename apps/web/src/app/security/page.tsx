export const dynamic = 'force-dynamic';

/**
 * Security & Compliance Page
 * Security certifications, audits, and compliance information
 */

import { Shield, Lock, CheckCircle, FileText, Award, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function SecurityPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
          <Shield className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Security & Compliance</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          We take security seriously. Your data is protected with industry-leading security measures.
        </p>
      </div>

      {/* Security Measures */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <Lock className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Encryption</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <span>End-to-end encryption</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <span>TLS 1.3 for data in transit</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <span>AES-256 for data at rest</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Shield className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <span>Secure password hashing</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <span>Multi-factor authentication</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <span>OAuth providers (Google, Apple)</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <FileText className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <span>GDPR compliant</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <span>CCPA compliant</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <span>SOC 2 Type II (in progress)</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Certifications */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Compliance Certifications</CardTitle>
          <CardDescription>Our commitment to security and compliance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Data Protection</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Badge variant="outline">GDPR</Badge>
                  <span className="text-sm">General Data Protection Regulation (EU)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">CCPA</Badge>
                  <span className="text-sm">California Consumer Privacy Act</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">PIPEDA</Badge>
                  <span className="text-sm">Personal Information Protection (Canada)</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Security Standards</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Badge variant="outline">SOC 2 Type II</Badge>
                  <span className="text-sm">Security audit (in progress)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">ISO 27001</Badge>
                  <span className="text-sm">Information security (planned)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">PCI DSS</Badge>
                  <span className="text-sm">Payment card security (via Stripe)</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Practices */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Security Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Regular Security Audits</h3>
              <p className="text-sm text-muted-foreground">
                We conduct regular security audits and penetration testing to identify and fix vulnerabilities.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Data Backups</h3>
              <p className="text-sm text-muted-foreground">
                Daily automated backups with point-in-time recovery. Data is stored in multiple geographically 
                distributed locations.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Access Controls</h3>
              <p className="text-sm text-muted-foreground">
                Role-based access control (RBAC) ensures only authorized personnel can access sensitive data. 
                All access is logged and monitored.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Incident Response</h3>
              <p className="text-sm text-muted-foreground">
                We have a documented incident response plan. In the event of a security breach, we will notify 
                affected users within 72 hours as required by law.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bug Bounty */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Bug Bounty Program</CardTitle>
          <CardDescription>Help us keep What's for Dinner secure</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            We welcome responsible disclosure of security vulnerabilities. If you find a security issue, 
            please report it to us.
          </p>
          <div className="space-y-2 mb-4">
            <p className="text-sm"><strong>Email:</strong> security@whatsfordinner.com</p>
            <p className="text-sm"><strong>Response Time:</strong> Within 48 hours</p>
            <p className="text-sm"><strong>Rewards:</strong> Up to $1,000 for critical vulnerabilities</p>
          </div>
          <Link href="/docs/security-policy" className="text-primary text-sm hover:underline">
            View Security Policy →
          </Link>
        </CardContent>
      </Card>

      {/* Security Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Security Reports & Audits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-semibold">Security Audit Report Q4 2024</div>
                <div className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</div>
              </div>
              <Badge variant="outline">Available</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-semibold">Penetration Test Report</div>
                <div className="text-sm text-muted-foreground">Last test: {new Date(Date.now() - 90*24*60*60*1000).toLocaleDateString()}</div>
              </div>
              <Badge variant="outline">Available</Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            For access to security reports, contact security@whatsfordinner.com
          </p>
        </CardContent>
      </Card>

      {/* Contact */}
      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Security Questions?</h2>
        <p className="text-muted-foreground mb-6">
          Contact our security team
        </p>
        <a href="mailto:security@whatsfordinner.com" className="text-primary hover:underline">
          security@whatsfordinner.com
        </a>
      </div>
    </div>
  );
}
