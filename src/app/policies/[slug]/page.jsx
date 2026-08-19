import React from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { FileText, ArrowLeft, ShieldCheck, HelpCircle, RefreshCcw } from 'lucide-react'
import { notFound } from 'next/navigation'

// Pre-render these static routes
export function generateStaticParams() {
  return [
    { slug: 'privacy' },
    { slug: 'terms' },
    { slug: 'refund' },
    { slug: 'contact' },
  ]
}

const policyContent = {
  privacy: {
    title: "Privacy Policy",
    icon: <ShieldCheck className="w-8 h-8 text-teal-600" />,
    lastUpdated: "August 15, 2026",
    content: (
      <div className="space-y-6">
        <p>At Asentra Education Platform, we prioritize the protection of your personal and academic data. This Privacy Policy outlines how we collect, use, and safeguard your information.</p>
        
        <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">1. Information We Collect</h3>
        <p>We collect information you provide directly to us when creating an account, including your name, email, target examination year, and phone number. We also automatically collect telemetry data related to your course progress, video watch times, test scores, and platform interactions to power our Gamification and AI Mentor systems.</p>
        
        <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">2. How We Use Your Data</h3>
        <p>Your data is exclusively used to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Provide and maintain the learning platform.</li>
          <li>Personalize your learning experience via the AI Mentor.</li>
          <li>Calculate your XP, Levels, and Study Streaks.</li>
          <li>Process transactions and send physical book kits.</li>
        </ul>

        <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">3. Data Security</h3>
        <p>We implement state-of-the-art security measures to protect your data. All transactions are securely processed via Razorpay. We do not store your credit card information on our servers.</p>
      </div>
    )
  },
  terms: {
    title: "Terms of Service",
    icon: <FileText className="w-8 h-8 text-indigo-600" />,
    lastUpdated: "August 15, 2026",
    content: (
      <div className="space-y-6">
        <p>By accessing or using the Asentra Education Platform, you agree to be bound by these Terms of Service.</p>
        
        <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">1. Account Responsibilities</h3>
        <p>You are responsible for safeguarding your account credentials. Sharing your account or video access with third parties is strictly prohibited and will result in an immediate, non-refundable ban.</p>
        
        <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">2. Intellectual Property</h3>
        <p>All content, including videos, PDFs, mock exams, and the AI Mentor software, are the exclusive intellectual property of Asentra Technologies. Unauthorized distribution constitutes piracy.</p>

        <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">3. Platform Conduct</h3>
        <p>We expect all students to maintain a respectful environment. Any abuse of the Gamification system (e.g., botting to gain XP) or inappropriate behavior in live classes will lead to account suspension.</p>
      </div>
    )
  },
  refund: {
    title: "Refund & Cancellation Policy",
    icon: <RefreshCcw className="w-8 h-8 text-orange-600" />,
    lastUpdated: "August 15, 2026",
    content: (
      <div className="space-y-6">
        <p>We want you to be completely satisfied with your educational investment. Our refund policy is designed to be fair to both our students and our educators.</p>
        
        <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">1. Digital Courses & Subscriptions</h3>
        <p>We offer a strict 7-day money-back guarantee for all digital-only courses. If you are not satisfied with the content within the first 7 days of purchase, you may request a full refund, provided you have watched less than 10% of the video content.</p>
        
        <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">2. Courses with Physical Book Kits</h3>
        <p>For hybrid courses that include physical book dispatches, the cost of the printed materials and shipping (standardized at ₹1,500) is strictly non-refundable once the tracking ID is generated. The remainder of the digital course fee is subject to the standard 7-day policy.</p>

        <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">3. How to Request a Cancellation</h3>
        <p>To request a cancellation, please email support@asentra.edu.in with your Order ID. Refunds are processed back to the original payment method within 5-7 business days.</p>
      </div>
    )
  },
  contact: {
    title: "Contact Us",
    icon: <HelpCircle className="w-8 h-8 text-blue-600" />,
    lastUpdated: "August 15, 2026",
    content: (
      <div className="space-y-6">
        <p>Have a question or need technical support? The Asentra Team is here to help you achieve your academic dreams.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-2">Technical Support</h4>
            <p className="text-sm text-slate-600 mb-4">Having trouble with video playback, the AI Mentor, or your XP Streak?</p>
            <p className="font-mono text-sm font-bold text-indigo-600">support@asentra.edu.in</p>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-2">Academic Guidance</h4>
            <p className="text-sm text-slate-600 mb-4">Need help choosing the right batch or configuring your study planner?</p>
            <p className="font-mono text-sm font-bold text-indigo-600">academics@asentra.edu.in</p>
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">Corporate Headquarters</h3>
        <div className="bg-slate-900 text-slate-300 p-8 rounded-3xl mt-4">
          <p className="font-bold text-white mb-2">Asentra Technologies Pvt. Ltd.</p>
          <p>IIT Bombay Campus Link Road,</p>
          <p>Powai, Mumbai,</p>
          <p>Maharashtra, India 400076</p>
          <p className="mt-4 pt-4 border-t border-slate-800">Phone: +91 98765 43210 (Mon-Sat, 9AM-6PM IST)</p>
        </div>
      </div>
    )
  }
}

export default async function PolicyPage({ params }) {
  const { slug } = await params
  const policy = policyContent[slug]

  if (!policy) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20 md:pb-0">
      <Navbar />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 md:py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-10 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                {policy.icon}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{policy.title}</h1>
                <p className="text-sm font-medium text-slate-500 mt-1">Last Updated: {policy.lastUpdated}</p>
              </div>
            </div>
          </div>

          <div className="prose prose-slate prose-indigo max-w-none prose-headings:font-black prose-p:font-medium prose-p:text-slate-600 prose-li:text-slate-600">
            {policy.content}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
