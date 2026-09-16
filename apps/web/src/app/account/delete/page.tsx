/**
 * Account Deletion Page
 * Secure account deletion with data export option
 */

'use client';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('page');



import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AlertTriangle, Download, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function DeleteAccountPage() {
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const supabase = createClientComponentClient();

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Trigger data export
      const response = await fetch('/api/account/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `whats-for-dinner-data-${Date.now()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      _logger.error('Export error:', { error: error instanceof Error ? error.message : String(error) });
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmationText !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);

    try {
      // Delete user data
      const { error } = await supabase.rpc('delete_user_account');

      if (error) {
        throw error;
      }

      // Sign out
      await supabase.auth.signOut();

      // Redirect to home
      window.location.href = '/';
    } catch (error) {
      _logger.error('Account deletion error:', { error: error instanceof Error ? error.message : String(error) });
      alert('Failed to delete account. Please contact support.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Delete Account</h1>
        <p className="text-muted-foreground">
          Permanently delete your account and all associated data
        </p>
      </div>

      <Card className="border-destructive mb-6">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            <CardTitle>Warning: This Action Cannot Be Undone</CardTitle>
          </div>
          <CardDescription>
            Deleting your account will permanently remove all your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">What Will Be Deleted:</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li>Your profile and account information</li>
              <li>All meal plans and recipes</li>
              <li>Pantry inventory</li>
              <li>Saved preferences and settings</li>
              <li>Subscription information</li>
              <li>All user-generated content</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">What Will Be Retained:</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
              <li>Anonymized usage data (for analytics)</li>
              <li>Legal records (as required by law)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Export Your Data First</CardTitle>
          <CardDescription>
            Before deleting, download a copy of all your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleExportData}
            disabled={isExporting}
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export All Data'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Confirm Account Deletion</CardTitle>
          <CardDescription>
            To confirm, type <strong>DELETE</strong> in the field below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="text"
            placeholder="Type DELETE to confirm"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            className="font-mono"
          />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full"
                disabled={confirmationText !== 'DELETE' || isDeleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? 'Deleting Account...' : 'Delete My Account'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account and all data. 
                  This action cannot be undone. Make sure you've exported your data first.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground"
                >
                  Yes, Delete My Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
