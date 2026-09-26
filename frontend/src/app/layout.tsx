import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'TalentFit AI - Tailor Your Resume & Generate Cover Letters',
  description: 'Analyze any job posting, optimize your resume with factual evidence, discover missing keywords, and generate ATS-ready cover letters in seconds.',
  keywords: ['Resume Optimizer', 'ATS Resume', 'AI Job Application', 'Cover Letter Generator', 'Job Match Score'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-slate-950 text-slate-100 min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
