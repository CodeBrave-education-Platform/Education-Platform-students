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
      ASENTRA Technologies ("we", "our", "us") respects your privacy and is committed to protecting your personal data. This privacy policy informs you how we look after your personal data when you visit our website (regardless of where you visit it from) and tells you about your privacy rights and how the law protects you.
      
      1. Information We Collect
      We collect, use, store and transfer different kinds of personal data about you, including Identity Data (first name, last name, username), Contact Data (billing address, delivery address, email address, telephone numbers), Financial Data (payment card details), and Transaction Data (details about payments to and from you and other details of products and services you have purchased from us).
      
      2. How We Use Your Data
      We will only use your personal data when the law allows us to. Most commonly, we will use your personal data to perform the contract we are about to enter into or have entered into with you (such as enrolling you in a test series), or where it is necessary for our legitimate interests.
      
      3. Data Security
      We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed. Your data is encrypted at rest and in transit via enterprise-grade secure databases and Razorpay secure payment gateways.
      
      4. Data Retention
      We will only retain your personal data for as long as reasonably necessary to fulfil the purposes we collected it for, including for the purposes of satisfying any legal, regulatory, tax, accounting or reporting requirements.
    `
  },
  terms: {
    title: 'Terms & Conditions',
    lastUpdated: 'August 2026',
    content: `
      Welcome to ASENTRA. By accessing our platform, you agree to these Terms and Conditions. Please read them carefully.
      
      1. Account Responsibility
      You are responsible for maintaining the confidentiality of your account password and login credentials. You must not share your account details with any third party.
      
      2. Intellectual Property Rights
      All content included on this platform, such as video lectures, mock tests, PDFs, graphics, logos, and software, is the property of ASENTRA Technologies or its content suppliers and protected by international copyright laws. You may not distribute, reproduce, or monetize any platform content.
      
      3. Acceptable Use
      You agree to use the platform for lawful educational purposes only. You must not use the platform in any way that causes, or may cause, damage to the platform or impairment of the availability or accessibility of the platform.
      
      4. Termination and Suspension
      We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms and Conditions or engage in content piracy.
      
      5. Governing Law
      These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.
    `
  },
  refund: {
    title: 'Refund & Cancellation Policy',
    lastUpdated: 'August 2026',
    content: `
      We strive to provide the best educational experience at ASENTRA. However, we understand that situations may arise where you need to request a refund.
      
      1. Refund Eligibility Window
      Refunds are only permitted within 7 days of the initial course or test series purchase. After 7 days, no refunds will be processed under any circumstances.
      
      2. Usage Limitations
      To be eligible for a refund within the 7-day window, you must not have consumed more than 10% of the video content, and you must not have attempted any proctored mock tests or downloaded protected PDF materials.
      
      3. Cancellation Process
      You can cancel your recurring subscriptions (if applicable) at any time from your account dashboard. Future recurring billing will be stopped immediately upon cancellation.
      
      4. Refund Processing Time
      Approved refunds will be credited back to the original payment method (via Razorpay) within 5-7 business days. We do not support cash refunds or transfers to alternate bank accounts.
    `
  },
  contact: {
    title: 'Contact Us',
    lastUpdated: 'August 2026',
    content: `
      We are always here to help you succeed in your IIT JEE and academic journey.
      
      Corporate Headquarters:
      ASENTRA Technologies
      IIT Bombay Campus Link Road, Powai
      Mumbai, Maharashtra 400076, India
      
      Contact Information:
      Phone: +91 98765 43210 (Toll-Free within India)
      Email: support@asentra.edu.in
      Grievance Officer: legal@asentra.edu.in
      
      Operating Hours: 
      Monday to Saturday, 9:00 AM - 6:00 PM IST
      (Closed on National Holidays)
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
