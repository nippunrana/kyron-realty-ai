import type { Metadata } from "next";
import { LegalLayout, Clause, Highlight } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Terms of Service | Kyron Realty AI",
  description:
    "The terms governing use of the Kyron Realty AI platform operated by Egnitech, including AI voice agent limits, listing obligations and liability.",
};

const EFFECTIVE_DATE = "10 September 2026";

export default function TermsOfServicePage() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="These terms form a binding agreement between you and Egnitech covering your use of the Kyron Realty AI platform."
      effectiveDate={EFFECTIVE_DATE}
    >
      <Clause id="acceptance" heading="1. Acceptance of these terms">
        <p>
          These Terms of Service (the <strong>&quot;Terms&quot;</strong>) govern your access
          to and use of Kyron Realty AI (the <strong>&quot;Platform&quot;</strong>), operated
          by <strong>Egnitech</strong> (<strong>&quot;we&quot;</strong>,{" "}
          <strong>&quot;us&quot;</strong>, <strong>&quot;our&quot;</strong>) at{" "}
          <span className="font-mono text-xs">
            https://egnitech.com/projects/kyron-realty-ai
          </span>
          .
        </p>
        <p>
          By creating an account, listing a property, browsing a listing, speaking to our AI
          voice agent, or booking a viewing, you accept these Terms. If you do not accept
          them, do not use the Platform.
        </p>
      </Clause>

      <Clause id="definitions" heading="2. Definitions">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Owner</strong> — a property owner, landlord or agent who holds an account
            and publishes a listing.
          </li>
          <li>
            <strong>Visitor</strong> — any person who browses a listing, speaks to the AI
            voice agent, submits an enquiry or books a viewing, whether or not they hold an
            account.
          </li>
          <li>
            <strong>AI Agent</strong> — the automated voice and text system that answers
            questions about a listing, qualifies enquiries and schedules viewings.
          </li>
          <li>
            <strong>Listing Content</strong> — all information, text, photographs, media,
            pricing and terms an Owner submits about a property.
          </li>
        </ul>
      </Clause>

      <Clause id="eligibility" heading="3. Eligibility and accounts">
        <p>
          You must be at least 18 years old and legally capable of entering into a contract.
          You are responsible for the accuracy of your account information, for keeping your
          password confidential, and for all activity under your account. Tell us at once at{" "}
          <a href="mailto:privacy@egnitech.com" className="font-medium text-blue-700 underline">
            privacy@egnitech.com
          </a>{" "}
          if you suspect unauthorised access.
        </p>
        <p>
          You may sign in with an email address and password, or with Google. If you connect
          Google Calendar, you additionally agree to the handling described in our Privacy
          Policy, and you may disconnect at any time.
        </p>
      </Clause>

      <Clause id="owner-obligations" heading="4. Owner obligations and warranties">
        <p>By publishing Listing Content, you represent and warrant that:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            you own the property or are lawfully authorised to market and let or sell it;
          </li>
          <li>
            all facts you provide — address, area, pricing, deposit, lease terms,
            specifications, availability and amenities — are accurate and kept up to date;
          </li>
          <li>
            you hold the rights to every photograph and media file you upload, and their use
            on the Platform infringes nobody;
          </li>
          <li>
            your listing complies with applicable law, including real estate regulation, and
            does not discriminate against any person on any ground prohibited by law;
          </li>
          <li>
            the negotiation limits, floor prices and concessions you configure are ones you
            are genuinely willing to honour.
          </li>
        </ul>
        <p>
          You grant us a non-exclusive, royalty-free licence to host, reproduce, adapt and
          display your Listing Content for the purpose of operating and promoting the
          Platform and the listing itself. You may revoke this licence by deleting the
          listing.
        </p>
        <Highlight>
          <p>
            <strong>
              Property facts shown on the Platform are supplied by the Owner, not verified by
              Egnitech.
            </strong>{" "}
            We do not independently inspect properties, confirm title, or audit pricing. Every
            Visitor must carry out their own due diligence before committing to a transaction.
          </p>
        </Highlight>
      </Clause>

      <Clause id="ai-agent" heading="5. The AI Agent, negotiation and binding offers">
        <p>
          The Platform holds automated conversations with Visitors. Within the limits an Owner
          has configured, the AI Agent may discuss price, propose concessions, and record the
          terms discussed. It also generates summaries, sentiment assessments and lead scores.
        </p>
        <Highlight>
          <p>
            <strong>
              Nothing the AI Agent says constitutes a binding offer, acceptance, quotation or
              contract.
            </strong>{" "}
            Any price, discount, concession or term arising from a conversation with the AI
            Agent is <strong>indicative only</strong> and is subject to written confirmation by
            the Owner. A binding agreement is formed only when the Owner and the Visitor
            execute a separate written agreement outside the Platform. Neither party may rely
            on an AI conversation as evidence of a concluded bargain.
          </p>
        </Highlight>
        <p>
          The AI Agent may produce inaccurate, incomplete or outdated statements. It does not
          give legal, financial, tax, valuation or investment advice, and automated valuation
          estimates and growth scores are algorithmic indications, not professional
          valuations. Obtain independent professional advice before making a decision.
        </p>
        <p>
          We may terminate a call at any time, including where a conversation moves away from
          the property being discussed or breaches section 7.
        </p>
      </Clause>

      <Clause id="recording" heading="6. Call recording and transcription">
        <p>
          Conversations with the AI Agent are transcribed and stored, and are analysed to
          produce summaries, sentiment assessments and lead scores. By starting a voice
          conversation you consent to this. If you do not consent, use the written enquiry
          route instead. Full detail is in our{" "}
          <a href="/privacy" className="font-medium text-blue-700 underline">
            Privacy Policy
          </a>
          .
        </p>
        <p>
          Owners receive transcripts, summaries and enquiry details for conversations about
          their own listings, and must handle that information lawfully and only to respond to
          the enquiry.
        </p>
      </Clause>

      <Clause id="viewings" heading="7. Viewings and appointments">
        <p>
          The Platform allows Visitors to book property viewings, and may write confirmed
          appointments into a calendar the Owner has connected. We schedule appointments; we
          do not conduct, supervise or attend them.
        </p>
        <p>
          Attendance, safety, access and conduct at a viewing are entirely between the Owner
          and the Visitor. Confirm arrangements directly with the other party before
          travelling — availability shown on the Platform may be out of date, and scheduling
          depends on third-party calendar services that may be unavailable.
        </p>
      </Clause>

      <Clause id="acceptable-use" heading="8. Acceptable use">
        <p>You must not:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            post false, fraudulent, misleading or duplicated listings, or property you have no
            authority to market;
          </li>
          <li>
            impersonate another person, or submit an enquiry using another person&apos;s
            contact details;
          </li>
          <li>
            use the Platform to harass, defraud, spam or discriminate against any person;
          </li>
          <li>
            scrape, crawl, harvest or bulk-extract listings, contact details or transcripts;
          </li>
          <li>
            attempt to bypass authentication, rate limits or negotiation floors, or probe,
            attack or disrupt the Platform or its providers;
          </li>
          <li>
            manipulate the AI Agent into disclosing confidential configuration, another
            party&apos;s data, or terms outside the Owner&apos;s configured limits;
          </li>
          <li>
            reverse engineer the Platform, or resell access to it without our written consent.
          </li>
        </ul>
      </Clause>

      <Clause id="ip" heading="9. Intellectual property">
        <p>
          The Platform, its software, design, branding and content — other than Listing
          Content — belong to Egnitech and its licensors. These Terms grant you a limited,
          revocable, non-transferable right to use the Platform for its intended purpose, and
          no other rights.
        </p>
      </Clause>

      <Clause id="third-parties" heading="10. Third-party services">
        <p>
          The Platform depends on third-party services, including Agora for real-time
          communication, Google for language, maps and calendar services, and speech vendors
          for recognition and synthesis. Their availability and performance are outside our
          control, and interruption of any of them may interrupt the Platform. Your use of a
          third-party service through the Platform may also be governed by that
          provider&apos;s own terms.
        </p>
      </Clause>

      <Clause id="availability" heading="11. Availability and changes">
        <p>
          We provide the Platform on an <strong>&quot;as is&quot;</strong> and{" "}
          <strong>&quot;as available&quot;</strong> basis. We do not guarantee uninterrupted or
          error-free operation, and we may modify, suspend or discontinue any feature at any
          time. Where the Platform is offered free of charge, we may change that on notice; any
          paid plan is governed by a separate written agreement between us.
        </p>
      </Clause>

      <Clause id="disclaimer" heading="12. Disclaimer of warranties">
        <p>
          To the fullest extent permitted by law, we disclaim all warranties, express or
          implied, including merchantability, fitness for a particular purpose,
          non-infringement, and any warranty as to the accuracy, completeness or reliability of
          Listing Content, AI-generated output, valuation estimates, neighbourhood data,
          travel-time data or availability information.
        </p>
      </Clause>

      <Clause id="liability" heading="13. Limitation of liability">
        <p>
          To the fullest extent permitted by law, Egnitech is not liable for any indirect,
          incidental, special, consequential, punitive or exemplary loss, nor for loss of
          profit, revenue, goodwill, data or opportunity, arising from your use of the
          Platform.
        </p>
        <p>
          This includes, without limitation, loss arising from an inaccurate listing, an
          inaccurate or unexpected AI Agent statement, a failed, missed or double-booked
          viewing, a calendar synchronisation failure, or any dispute or transaction between an
          Owner and a Visitor.
        </p>
        <p>
          Where liability cannot be excluded, our total aggregate liability for all claims is
          limited to the greater of the amount you paid us for the Platform in the twelve
          months before the claim, or INR 5,000. Nothing in these Terms excludes liability that
          cannot lawfully be excluded, including for fraud.
        </p>
      </Clause>

      <Clause id="indemnity" heading="14. Indemnity">
        <p>
          You agree to indemnify and hold harmless Egnitech and its personnel against any
          claim, loss, liability or expense (including reasonable legal fees) arising from your
          Listing Content, your breach of these Terms or of applicable law, or a dispute
          between you and another user of the Platform.
        </p>
      </Clause>

      <Clause id="termination" heading="15. Suspension and termination">
        <p>
          You may stop using the Platform at any time and ask us to close your account by
          emailing{" "}
          <a href="mailto:privacy@egnitech.com" className="font-medium text-blue-700 underline">
            privacy@egnitech.com
          </a>
          . We may suspend or terminate access, and remove any listing, where we reasonably
          believe these Terms or the law have been breached, or to protect the Platform or its
          users. Sections 9, 12, 13, 14, 17 and 18 survive termination.
        </p>
      </Clause>

      <Clause id="changes" heading="16. Changes to these terms">
        <p>
          We may update these Terms as the Platform develops. We will change the effective date
          at the top of this page, and where a change is significant we will give notice through
          the Platform. Continuing to use the Platform after a change means you accept the
          revised Terms.
        </p>
      </Clause>

      <Clause id="law" heading="17. Governing law and jurisdiction">
        <p>
          These Terms are governed by the laws of India. Subject to the paragraph below, the
          courts at <strong>[CITY, STATE]</strong>, India have exclusive jurisdiction over any
          dispute arising out of or in connection with these Terms or the Platform.
        </p>
        <p>
          Before commencing proceedings, both parties agree to attempt in good faith to resolve
          the dispute by writing to the other and allowing thirty days for a response.
        </p>
      </Clause>

      <Clause id="general" heading="18. General">
        <p>
          These Terms, together with the Privacy Policy, are the entire agreement between you
          and us regarding the Platform. If any provision is held unenforceable, the rest
          remains in force. Our failure to enforce a provision is not a waiver of it. You may
          not assign these Terms without our consent; we may assign them in connection with a
          merger or acquisition.
        </p>
      </Clause>

      <Clause id="contact" heading="19. Contact">
        <p>
          Egnitech, operator of Kyron Realty AI —{" "}
          <a href="mailto:privacy@egnitech.com" className="font-medium text-blue-700 underline">
            privacy@egnitech.com
          </a>
          .
        </p>
      </Clause>
    </LegalLayout>
  );
}
