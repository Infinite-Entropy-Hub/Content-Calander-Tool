import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Data Deletion Instructions | Content Calendar",
  description: "Instructions for requesting deletion of Content Calendar and connected Meta data.",
};

export default function DataDeletionPage() {
  return <LegalPage title="Data Deletion Instructions" description="You may request deletion of your Content Calendar account data and information received through connected platforms at any time." sections={[
    { title: "How to request deletion", content: <ol className="space-y-2 [&_li]:list-decimal"><li>Email <a href="mailto:shardul.jeurkar07@gmail.com?subject=Content%20Calendar%20Data%20Deletion%20Request">shardul.jeurkar07@gmail.com</a> from the email address associated with your Content Calendar account.</li><li>Use the subject line <strong className="text-foreground">Content Calendar Data Deletion Request</strong>.</li><li>Include your account email and state whether you want all account data deleted or only data associated with a particular connected platform.</li><li>We may ask you to verify ownership before processing the request.</li></ol> },
    { title: "What will be deleted", content: <ul><li>Your Content Calendar profile and saved preferences.</li><li>Saved social-platform credentials and connection details.</li><li>Content plans, posts, notes, automation rules, and automation delivery history associated with your account.</li><li>Stored Meta identifiers, comments, and message-event data associated with your automations, subject to legal or security retention requirements.</li></ul> },
    { title: "Processing time", content: <p>We will acknowledge the request and ordinarily complete verified deletion requests within 30 days. We will notify you if additional time is required by law or because of technical complexity.</p> },
    { title: "Disconnect Meta immediately", content: <><p>You can stop future access immediately from Facebook or Instagram by opening your account settings, finding Business Integrations or connected apps, and removing the Content Calendar/Automation app. You may also revoke the System User token from Meta Business Settings.</p><p>Disconnecting Meta prevents future API access but does not replace a deletion request for information already stored in Content Calendar.</p></> },
    { title: "Information we may retain", content: <p>Limited records may be retained where required for legal compliance, fraud prevention, security investigations, or resolving disputes. Any retained information will remain restricted and will not be used for normal product operation.</p> },
    { title: "Contact", content: <p>Send deletion questions or requests to <a href="mailto:shardul.jeurkar07@gmail.com">shardul.jeurkar07@gmail.com</a>.</p> },
  ]} />;
}
