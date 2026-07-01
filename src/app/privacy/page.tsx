import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Content Calendar",
  description: "Privacy policy for the Content Calendar social media management application.",
};

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" description="This policy explains what information Content Calendar collects, why it is used, and the choices available to you when connecting social media accounts." sections={[
    { title: "1. Information we collect", content: <><p>We may collect your email address and account identifier when you sign in; profile preferences; content-planning information; media and post metadata; automation settings; and social-platform identifiers needed to provide publishing and comment-automation features.</p><p>When you connect Meta, Google, X, or another platform, we store the access credentials you provide so the application can perform actions you request. We do not ask for or store your social-media password.</p></> },
    { title: "2. Information received from Meta", content: <><p>For connected Facebook Pages and Instagram Professional accounts, we may process Page and account IDs, media IDs, captions, public comments, commenter identifiers and usernames, message events, and API response data. This information is used only to provide the publishing, comment-reply, private-reply, and automation features you configure.</p></> },
    { title: "3. How we use information", content: <ul><li>Authenticate users and maintain their workspace.</li><li>Schedule and publish content selected by the user.</li><li>Detect configured comment keywords and deliver configured replies.</li><li>Display automation history, delivery status, and errors.</li><li>Protect the service, diagnose failures, and prevent duplicate or unauthorized actions.</li></ul> },
    { title: "4. Sharing and service providers", content: <><p>We do not sell personal information. Information is shared only when required to operate the service, comply with law, protect users, or carry out an action you requested. Infrastructure providers may include Supabase for authentication and database services, the application hosting provider, and the social platforms you connect.</p><p>Your use of a connected platform also remains subject to that platform&apos;s privacy policy and terms.</p></> },
    { title: "5. Retention and security", content: <><p>Information is retained while your account or automation remains active and as reasonably required for security, troubleshooting, and legal obligations. Access credentials are restricted by account-level access controls. No online service can guarantee absolute security, so you should revoke a platform token immediately if you believe it has been exposed.</p></> },
    { title: "6. Your choices and rights", content: <><p>You can disconnect a platform by revoking its token in the platform&apos;s security settings. You may also request access, correction, or deletion of your Content Calendar information. See our <a href="/data-deletion">Data Deletion Instructions</a>.</p></> },
    { title: "7. Children", content: <p>Content Calendar is intended for business and creator use and is not directed to children under 13. We do not knowingly collect personal information from children.</p> },
    { title: "8. Changes to this policy", content: <p>We may update this policy when the service or legal requirements change. The updated date at the top of this page identifies the latest revision.</p> },
    { title: "9. Contact", content: <p>Questions or privacy requests can be sent to <a href="mailto:shardul.jeurkar07@gmail.com">shardul.jeurkar07@gmail.com</a>.</p> },
  ]} />;
}
