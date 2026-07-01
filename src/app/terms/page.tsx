import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service | Content Calendar",
  description: "Terms governing use of the Content Calendar application.",
};

export default function TermsPage() {
  return <LegalPage title="Terms of Service" description="These terms govern your use of Content Calendar and its social-media publishing and automation features." sections={[
    { title: "1. Acceptance", content: <p>By using Content Calendar, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the service.</p> },
    { title: "2. Your accounts and credentials", content: <><p>You are responsible for your account, the accuracy of the credentials you provide, and all activity performed through your connected social accounts. You must have authority to manage every Page, account, and item of content you connect.</p><p>Do not share access tokens or secrets publicly. Revoke and replace credentials you believe have been exposed.</p></> },
    { title: "3. Acceptable use", content: <ul><li>Do not use the service for spam, harassment, deception, unlawful content, or unauthorized access.</li><li>Do not violate Meta, Instagram, Facebook, Google, X, or another connected platform&apos;s policies.</li><li>Do not attempt to bypass platform limits, messaging windows, permissions, or technical safeguards.</li><li>Only publish content and distribute resources you have the right to use.</li></ul> },
    { title: "4. Automations", content: <p>You control each automation&apos;s post, keywords, replies, and destination links. You are responsible for reviewing those messages and links. Platform APIs may delay, reject, rate-limit, or discontinue an automated action.</p> },
    { title: "5. Availability", content: <p>The service is provided on an “as available” basis. Features may change because of maintenance, third-party API changes, platform review requirements, outages, or account restrictions.</p> },
    { title: "6. Suspension and termination", content: <p>Access may be limited or terminated when necessary to protect the service or others, comply with law or platform policy, or respond to misuse. You may stop using the service and request deletion at any time.</p> },
    { title: "7. Disclaimers and limitation", content: <p>To the maximum extent permitted by law, Content Calendar is provided without warranties of uninterrupted operation or guaranteed publishing, delivery, reach, engagement, or follower growth. We are not responsible for actions taken by connected platforms or for indirect losses arising from platform or service interruptions.</p> },
    { title: "8. Changes", content: <p>We may update these Terms as the service evolves. Continued use after an update constitutes acceptance of the revised Terms.</p> },
    { title: "9. Contact", content: <p>Questions about these Terms can be sent to <a href="mailto:shardul.jeurkar07@gmail.com">shardul.jeurkar07@gmail.com</a>.</p> },
  ]} />;
}
