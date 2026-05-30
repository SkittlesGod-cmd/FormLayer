import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service – FormLayer",
  description: "FormLayer Terms of Service",
};

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: `By accessing or using FormLayer ("the Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Platform. These Terms apply to all users, including free accounts, paid subscribers, and agency partners.`,
  },
  {
    title: "2. Description of Service",
    body: `FormLayer is an AI-assisted product development platform for supplement brands, cosmetic formulators, and related businesses. The Platform provides tools for ingredient research, formulation drafting, regulatory compliance review, and manufacturer handoff. Features vary by subscription plan.`,
  },
  {
    title: "3. Eligibility",
    body: `You must be at least 18 years old and have the legal capacity to enter into a binding agreement to use the Platform. By using FormLayer, you represent and warrant that you meet these requirements. If you are using the Platform on behalf of a business, you represent that you have authority to bind that business to these Terms.`,
  },
  {
    title: "4. Account Registration",
    body: `You must create an account to access most features. You agree to provide accurate, current, and complete information and to keep it updated. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. Notify us immediately at legal@formlayer.co if you suspect unauthorized access.`,
  },
  {
    title: "5. Subscription Plans and Billing",
    body: `FormLayer offers free and paid subscription plans. Paid plans are billed monthly through our payment processor, Paddle. All fees are in USD and are non-refundable except as required by law or explicitly stated in our refund policy. We reserve the right to change pricing with 30 days' notice. Failure to pay may result in suspension or termination of your account.`,
  },
  {
    title: "6. Acceptable Use",
    body: `You agree not to: (a) use the Platform for any unlawful purpose or in violation of any regulations; (b) submit false, misleading, or infringing content; (c) attempt to reverse-engineer, copy, or redistribute the Platform's proprietary AI systems; (d) use automated scripts to abuse or overload the service; (e) resell or sublicense access to the Platform without written permission; or (f) use AI-generated outputs to make unsubstantiated drug claims on commercial products.`,
  },
  {
    title: "7. AI-Generated Content and Disclaimer",
    body: `FormLayer uses artificial intelligence to assist with formulation research and compliance review. All AI-generated content — including ingredient recommendations, dosage suggestions, compliance scores, and regulatory guidance — is provided for informational purposes only and does not constitute legal, medical, or regulatory advice.\n\nYou are solely responsible for verifying AI outputs, consulting qualified professionals, and ensuring your products comply with all applicable laws and regulations, including FDA regulations for dietary supplements, cosmetics, and OTC drugs. FormLayer makes no warranty that AI-generated content is accurate, complete, or suitable for any particular purpose.`,
  },
  {
    title: "8. Intellectual Property",
    body: `FormLayer and its licensors retain all rights to the Platform, including its software, AI models, design, and branding. You retain ownership of content you submit to the Platform ("User Content"). By submitting User Content, you grant FormLayer a limited, non-exclusive license to process it for the purpose of providing the service. We do not claim ownership of your formulations or business data.`,
  },
  {
    title: "9. Confidentiality and Data",
    body: `We treat your formulation data and business information as confidential. We do not sell your data to third parties. Data is used to operate and improve the Platform as described in our Privacy Policy. You acknowledge that AI models powering the Platform may be operated by third-party providers (such as OpenRouter) and that data submitted is subject to those providers' terms as well.`,
  },
  {
    title: "10. Termination",
    body: `You may cancel your account at any time from the billing settings. FormLayer may suspend or terminate your access immediately for violation of these Terms, non-payment, or if we reasonably believe your use poses a legal or security risk. Upon termination, your right to access the Platform ceases. We may retain anonymized usage data as permitted by law.`,
  },
  {
    title: "11. Limitation of Liability",
    body: `To the maximum extent permitted by applicable law, FormLayer and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform, including but not limited to regulatory fines, product recalls, or business losses. Our total liability to you for any claim shall not exceed the amount you paid us in the 12 months preceding the claim.`,
  },
  {
    title: "12. Indemnification",
    body: `You agree to indemnify and hold harmless FormLayer and its affiliates from any claims, damages, or expenses (including legal fees) arising from: (a) your use of the Platform; (b) your User Content; (c) your violation of these Terms; or (d) any product you develop using the Platform.`,
  },
  {
    title: "13. Governing Law and Disputes",
    body: `These Terms are governed by the laws of the State of Ohio, United States, without regard to conflict of law principles. Any dispute arising under these Terms shall be resolved by binding arbitration under the rules of the American Arbitration Association, except that either party may seek injunctive relief in a court of competent jurisdiction.`,
  },
  {
    title: "14. Changes to Terms",
    body: `We may update these Terms from time to time. We will notify you of material changes via email or an in-app notice at least 14 days before they take effect. Continued use of the Platform after changes become effective constitutes your acceptance of the updated Terms.`,
  },
  {
    title: "15. Contact",
    body: `For questions about these Terms, contact us at:\n\nFormLayer, Inc.\nlegal@formlayer.co`,
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-[720px] px-5 py-16 md:py-24">
      {/* Header */}
      <div className="mb-12">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Legal</p>
        <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.03em] text-gray-950 md:text-[40px]">
          Terms of Service
        </h1>
        <p className="mt-3 text-[14px] text-gray-500">
          Last updated: May 30, 2026 &nbsp;·&nbsp; Effective: May 30, 2026
        </p>
      </div>

      {/* Intro */}
      <div className="mb-10 rounded-xl border border-black/[0.06] bg-gray-50 px-6 py-5">
        <p className="text-[13px] leading-relaxed text-gray-600">
          Please read these Terms of Service carefully before using FormLayer. They govern your access to and use of our platform. Key points: AI-generated content is for informational purposes only and is not regulatory or legal advice; you are responsible for verifying all outputs; and paid subscriptions are billed monthly through Paddle.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-10">
        {SECTIONS.map(({ title, body }) => (
          <section key={title}>
            <h2 className="text-[16px] font-semibold text-gray-950">{title}</h2>
            <div className="mt-3 space-y-3">
              {body.split("\n\n").map((paragraph, i) => (
                <p key={i} className="text-[14px] leading-relaxed text-gray-600">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-16 border-t border-black/[0.06] pt-8">
        <p className="text-[13px] text-gray-400">
          © 2026 FormLayer, Inc. All rights reserved. These terms apply to formlayer.co and all related services.
        </p>
      </div>
    </div>
  );
}
