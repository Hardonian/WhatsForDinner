'use client';

export const dynamic = 'force-dynamic';

// [STAKE+TRUST:BEGIN:export_page]
import { useState } from "react";
import Link from "next/link";

export default function ExportDataPage() {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [format, setFormat] = useState<"json" | "csv">("json");

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ format }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.headers.get("Content-Disposition")?.split("filename=")[1] || `export_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExported(true);
    } catch (error) {
      // Error handled: Export failed:
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Export My Data</h1>
        <p className="text-muted-foreground text-lg">
          Request a copy of all personal data we hold about you. Data will be provided in your 
          chosen format and sent to your registered email address.
        </p>
      </div>

      <div className="bg-card rounded-lg p-6 border mb-8">
        <h2 className="text-2xl font-semibold mb-4">What's Included</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li>• Account information (name, email, preferences)</li>
          <li>• Pantry data (ingredients, dietary restrictions)</li>
          <li>• Recipe history (saved recipes, meal plans)</li>
          <li>• Usage data (last 180 days)</li>
          <li>• Audit log (your activity history)</li>
        </ul>
      </div>

      <div className="bg-card rounded-lg p-6 border mb-8">
        <h2 className="text-2xl font-semibold mb-4">Export Format</h2>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="format"
                value="json"
                checked={format === "json"}
                onChange={(e) => setFormat(e.target.value as "json" | "csv")}
                className="w-4 h-4"
              />
              <span className="font-medium">JSON</span>
              <span className="text-sm text-muted-foreground ml-2">
                Machine-readable format, includes all data
              </span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="format"
                value="csv"
                checked={format === "csv"}
                onChange={(e) => setFormat(e.target.value as "json" | "csv")}
                className="w-4 h-4"
              />
              <span className="font-medium">CSV</span>
              <span className="text-sm text-muted-foreground ml-2">
                Spreadsheet-compatible format, structured data
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg p-6 border mb-8">
        <h2 className="text-2xl font-semibold mb-4">Export Process</h2>
        <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
          <li>Click "Request Export" below</li>
          <li>We'll prepare your data (may take a few minutes)</li>
          <li>You'll receive an email with a download link</li>
          <li>Download your data within 7 days (link expires)</li>
        </ol>
        <p className="mt-4 text-sm text-muted-foreground">
          <strong>Response Time:</strong> Within 30 days per GDPR requirements
        </p>
      </div>

      {exported ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2 text-green-800 dark:text-green-200">
            Export Requested
          </h2>
          <p className="text-green-700 dark:text-green-300">
            Your export request has been submitted. You'll receive an email with your data 
            within 30 days. Check your inbox for the download link.
          </p>
        </div>
      ) : (
        <div className="mb-8">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? "Preparing Export..." : "Request Export"}
          </button>
        </div>
      )}

      <div className="bg-card rounded-lg p-6 border">
        <h2 className="text-2xl font-semibold mb-4">Your Data Rights</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li>
            <strong>Right to Access:</strong> You have the right to access your personal data (this page)
          </li>
          <li>
            <strong>Right to Rectification:</strong>{" "}
            <Link href="/settings" className="text-primary hover:underline">
              Update your profile
            </Link>
          </li>
          <li>
            <strong>Right to Erasure:</strong>{" "}
            <Link href="/settings/account/delete" className="text-primary hover:underline">
              Delete your account
            </Link>
          </li>
          <li>
            <strong>Right to Data Portability:</strong> Export your data (this page)
          </li>
        </ul>
      </div>

      <div className="mt-8 pt-8 border-t">
        <Link href="/settings" className="text-primary hover:underline">
          ← Back to Settings
        </Link>
      </div>
    </div>
  );
}
// [STAKE+TRUST:END:export_page]