import React from 'react';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return [
    { slug: 'privacy' },
    { slug: 'terms' },
    { slug: 'refund' },
    { slug: 'contact' },
  ];
}

const policyData = {
  privacy: {
    title: 'Privacy Policy',
    lastUpdated: 'August 2026',
    content: `
      ASENTRA Technologies ("we", "our", "us") respects your privacy and is committed to protecting your personal data.
      This privacy policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.
      
      1. Information We Collect: We collect your name, email address, phone number, and transaction details to provide you with seamless access to our learning matrix.
      2. How We Use Your Data: We strictly use this data for account management, payment processing, and performance analytics.
      3. Data Security: Your data is encrypted at rest and in transit via Supabase and Razorpay secure payment gateways.
    `
  },
  terms: {
    title: 'Terms & Conditions',
    lastUpdated: 'August 2026',
    content: `
      Welcome to ASENTRA. By accessing our platform, you agree to these Terms and Conditions.
      
      1. Account Responsibility: You are responsible for maintaining the confidentiality of your account password.
      2. Content Ownership: All video lectures, mock tests, and PDFs are the intellectual property of ASENTRA. You may not distribute or reproduce them.
      3. Acceptable Use: You agree to use the platform for educational purposes only.
      4. Termination: We reserve the right to terminate accounts that violate these terms or engage in piracy.
    `
  },
  refund: {
    title: 'Refund & Cancellation Policy',
    lastUpdated: 'August 2026',
    content: `
      We strive to provide the best educational experience at ASENTRA.
      
      1. Refund Window: Refunds are only permitted within 7 days of course purchase if you have not consumed more than 10% of the video content or taken any mock tests.
      2. Cancellation: You can cancel your subscription at any time from your dashboard. Future recurring billing will be stopped immediately.
      3. Processing: Approved refunds will be credited back to the original payment method (via Razorpay) within 5-7 business days.
    `
  },
  contact: {
    title: 'Contact Us',
    lastUpdated: 'August 2026',
    content: `
      We are always here to help you succeed in your IIT JEE journey.
      
      Corporate Office:
      ASENTRA Technologies
      IIT Bombay Campus Link Road, Powai
      Mumbai, Maharashtra 400076, India
      
      Phone: +91 98765 43210
      Email: support@asentra.edu.in
      
      Operating Hours: Monday to Saturday, 9:00 AM - 6:00 PM IST.
    `
  }
};

export default function PolicyPage({ params }) {
  const { slug } = params;
  const policy = policyData[slug];

  if (!policy) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 py-24 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">{policy.title}</h1>
        <p className="text-sm font-semibold text-slate-400 mb-8 uppercase tracking-widest">Last Updated: {policy.lastUpdated}</p>
        
        <div className="prose prose-slate max-w-none text-slate-600 font-medium whitespace-pre-line leading-relaxed">
          {policy.content}
        </div>
      </div>
    </div>
  );
}
