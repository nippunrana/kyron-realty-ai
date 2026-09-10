import type { Metadata } from "next";
import { LegalLayout, Clause, Highlight } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy | Kyron Realty AI",
  description:
    "How Egnitech collects, uses, stores and shares personal data in the Kyron Realty AI platform, including Google user data and voice call transcripts.",
};

const EFFECTIVE_DATE = "10 September 2026";

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="This policy explains what Kyron Realty AI collects, why we collect it, who we share it with, and the choices you have."
      effectiveDate={EFFECTIVE_DATE}
    >
      <Clause id="who-we-are" heading="1. Who we are">
        <p>
          Kyron Realty AI (the <strong>&quot;Platform&quot;</strong>) is operated by{" "}
          <strong>Egnitech</strong> (<strong>&quot;we&quot;</strong>,{" "}
          <strong>&quot;us&quot;</strong>, <strong>&quot;our&quot;</strong>). The Platform is
          served at{" "}
          <span className="font-mono text-xs">
            https://egnitech.com/projects/kyron-realty-ai
          </span>
          .
        </p>
        <p>
          For any question about this policy, or to exercise the rights described in
          section 12, contact us at{" "}
          <a href="mailto:privacy@egnitech.com" className="font-medium text-blue-700 underline">
            privacy@egnitech.com
          </a>
          .
        </p>
      </Clause>

      <Clause id="who-this-covers" heading="2. Whose data this policy covers">
        <p>The Platform handles personal data about two different groups of people:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Property owners and agents</strong> who create an account, list a
            property, and use our dashboard.
          </li>
          <li>
            <strong>Prospective buyers, tenants and other visitors</strong> who browse a
            public listing, speak to our AI voice agent, submit an enquiry, or book a
            viewing. You do <strong>not</strong> need an account to be in this group, and
            we may still record personal data about you as described below.
          </li>
        </ul>
        <p>
          If you are a visitor speaking to our voice agent, please read section 5
          carefully: those calls are transcribed and analysed.
        </p>
      </Clause>

      <Clause id="what-we-collect" heading="3. Information we collect">
        <p>
          <strong>Account information (owners and agents).</strong> Your name, email
          address, profile image, account role, and — if you register with a password —
          a cryptographically hashed version of that password. We never store your
          password in readable form.
        </p>
        <p>
          <strong>Google sign-in information.</strong> If you sign in with Google, we
          receive your Google account identifier, email address, name and profile
          picture, together with OAuth tokens. See section 4.
        </p>
        <p>
          <strong>Property and listing information.</strong> Everything an owner submits
          about a property: address and location, price and deposit, lease terms,
          physical specifications, photographs and media, amenities, availability, and
          the pricing and concession limits that govern how our AI agent may negotiate.
        </p>
        <p>
          <strong>Enquiry and lead information (visitors).</strong> Your name, email
          address, telephone number, preferred contact method, stated budget, target
          move-in date, whether you have pets, the number of occupants, and any terms
          discussed with the AI agent.
        </p>
        <p>
          <strong>Appointment information.</strong> The date and time of a viewing you
          book, the type of viewing, your contact details, and any special requests.
        </p>
        <p>
          <strong>Technical information.</strong> Standard server logs, session cookies
          required to keep you signed in, and basic device and browser information.
        </p>
      </Clause>

      <Clause id="google-user-data" heading="4. Google user data">
        <p>
          This section describes specifically how we handle data obtained through Google
          APIs, and applies in addition to the rest of this policy.
        </p>
        <p>
          <strong>Sign-in.</strong> When you choose &quot;Continue with Google&quot;, we
          receive your basic Google profile (identifier, name, email address, profile
          picture) solely to create and authenticate your Kyron Realty AI account.
        </p>
        <p>
          <strong>Google Calendar.</strong> Where you grant it, we request the following
          Google Calendar permissions, and no others:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-mono text-xs">.../auth/calendar.app.created</span> — lets
            us create a single secondary calendar named{" "}
            <strong>&quot;Kyron Real Estate AI&quot;</strong> in your Google account, and
            create, update and delete viewing appointments <em>on that calendar only</em>.
            This permission gives us <strong>no access whatsoever</strong> to your primary
            calendar or to any other calendar in your account.
          </li>
          <li>
            <span className="font-mono text-xs">.../auth/calendar.freebusy</span> — lets us
            read only your <strong>busy or free time blocks</strong>, so that we do not
            offer a viewing slot when you are already occupied. This permission returns
            availability windows only. It does <strong>not</strong> disclose event titles,
            descriptions, locations, attendees or any other event content, and we never
            attempt to read them.
          </li>
        </ul>
        <p>
          <strong>Why we need it.</strong> The sole purpose is scheduling property
          viewings: reading your availability so we can offer genuine free slots, and
          writing the confirmed appointment into the Kyron calendar we created.
        </p>
        <p>
          <strong>How tokens are stored.</strong> Google authorisation tokens are stored in
          our database on servers we control, protected by network and administrative
          access controls, and are used only to perform the scheduling actions described
          above. They are never sold, never used for advertising or profiling, and never
          transferred to any third party.
        </p>
        <p>
          <strong>Withdrawing access.</strong> You may revoke our access at any time from{" "}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-700 underline"
          >
            myaccount.google.com/permissions
          </a>
          . Revoking access immediately stops all calendar reading and writing. To have the
          stored tokens deleted from our systems as well, email{" "}
          <a href="mailto:privacy@egnitech.com" className="font-medium text-blue-700 underline">
            privacy@egnitech.com
          </a>{" "}
          and we will erase them. Calendars and events already created remain in your
          Google account, under your control, for you to keep or delete.
        </p>
        <Highlight>
          <p>
            Kyron Realty AI&apos;s use and transfer to any other app of information received
            from Google APIs will adhere to the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-700 underline"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
          <p className="mt-2">
            We do not use Google user data to train, retrain or improve any generalised
            artificial intelligence or machine learning model.
          </p>
        </Highlight>
      </Clause>

      <Clause id="voice" heading="5. Voice calls, recordings and transcripts">
        <p>
          The Platform provides a real-time AI voice agent. When you speak to it — whether
          as an owner onboarding a property or as a visitor enquiring about one — the
          following happens:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Your audio is carried over the Agora real-time network and processed by
            automatic speech recognition to convert it into text.
          </li>
          <li>
            A written <strong>transcript of the conversation is stored</strong> against the
            call record in our database, along with the call duration and the number of
            conversational turns.
          </li>
          <li>
            We generate and store an automated <strong>summary</strong> of the call, a{" "}
            <strong>sentiment assessment</strong>, and a numeric{" "}
            <strong>lead interest score</strong> reflecting how likely the enquiry is to
            proceed.
          </li>
          <li>
            Where you provide them during the call, contact and qualification details are
            saved as an enquiry and shared with the owner of the property you asked about.
          </li>
        </ul>
        <p>
          Please do not disclose payment card details, government identity numbers,
          passwords or other sensitive information during a voice call. If you do not wish
          to be recorded and transcribed, do not use the voice agent — use the written
          enquiry form or contact the owner directly instead.
        </p>
      </Clause>

      <Clause id="how-we-use" heading="6. How we use your information">
        <ul className="list-disc space-y-2 pl-5">
          <li>To create and secure your account and keep you signed in.</li>
          <li>To publish property listings that owners ask us to publish.</li>
          <li>
            To operate the AI voice agent, answer questions about a property, and pass
            qualified enquiries to the relevant owner.
          </li>
          <li>To schedule, confirm, change and cancel property viewings.</li>
          <li>
            To enrich listings with neighbourhood and travel-time information using Google
            Maps and Routes services.
          </li>
          <li>To operate, monitor, debug and secure the Platform, and to prevent abuse.</li>
          <li>To comply with our legal obligations.</li>
        </ul>
        <p>
          Under the Digital Personal Data Protection Act, 2023, we process personal data on
          the basis of the consent you give when you create an account, connect Google
          Calendar, speak to the voice agent, or submit an enquiry, and for the legitimate
          uses that Act permits. You may withdraw your consent at any time as described in
          section 12.
        </p>
      </Clause>

      <Clause id="automated" heading="7. Automated processing and AI">
        <p>
          The Platform uses large language models and other automated systems to conduct
          conversations, summarise calls, score enquiries, assess sentiment, generate
          listing content, and negotiate within limits an owner has set in advance.
        </p>
        <p>
          These outputs are assistive and can be wrong. They do not by themselves determine
          whether a property is offered or sold to you, and no legally binding agreement is
          formed by an AI conversation. A human owner or agent makes the final decision.
          You may ask us to review any automated output that affects you by writing to{" "}
          <a href="mailto:privacy@egnitech.com" className="font-medium text-blue-700 underline">
            privacy@egnitech.com
          </a>
          .
        </p>
      </Clause>

      <Clause id="sharing" heading="8. Who we share information with">
        <p>
          <strong>
            We do not sell your personal data, and we do not share it for advertising
            purposes.
          </strong>{" "}
          We share it only in the following circumstances:
        </p>
        <p>
          <strong>With property owners.</strong> If you enquire about or book a viewing for
          a property, the owner of that listing receives your enquiry details, the call
          summary, and the appointment details, so that they can respond to you.
        </p>
        <p>
          <strong>With service providers who process data on our behalf.</strong> Depending
          on how the Platform is configured at the time of your interaction, one or more of
          the following may process your data under contract with us:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Agora</strong> — real-time audio transport, signalling, and the
            conversational AI gateway that connects the voice services below.
          </li>
          <li>
            <strong>Google</strong> — Gemini large language models, Maps and Routes services
            for location and travel-time data, and Google Sign-In and Calendar.
          </li>
          <li>
            <strong>Speech and language vendors</strong> — one or more of Deepgram,
            Cartesia, ElevenLabs, Microsoft Azure Speech, MiniMax or OpenAI, used for speech
            recognition, speech synthesis, or language understanding.
          </li>
          <li>
            <strong>Our hosting and database provider</strong>, which stores the Platform
            data described in this policy.
          </li>
        </ul>
        <p>
          <strong>For legal reasons.</strong> We may disclose personal data where required
          by law, court order, or a lawful request from a public authority, or to establish,
          exercise or defend legal claims.
        </p>
        <p>
          <strong>On a business transfer.</strong> If the Platform or Egnitech is acquired
          or merged, personal data may transfer to the acquirer, subject to this policy.
        </p>
      </Clause>

      <Clause id="transfers" heading="9. International transfers">
        <p>
          Some of the service providers listed in section 8 operate outside India. Where
          personal data is transferred outside India, we do so in accordance with the
          Digital Personal Data Protection Act, 2023 and any restrictions the Central
          Government notifies, and we require our providers to protect the data under
          contract.
        </p>
      </Clause>

      <Clause id="retention" heading="10. How long we keep information">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Account data</strong> — for as long as your account is active, and then
            for a reasonable period afterwards to meet legal and accounting obligations.
          </li>
          <li>
            <strong>Property listings</strong> — until the owner deletes the listing or the
            account.
          </li>
          <li>
            <strong>Call transcripts, summaries and enquiries</strong> — retained to give
            owners a record of the enquiry and to resolve disputes, and deleted on request
            unless we are required to keep them.
          </li>
          <li>
            <strong>Google authorisation tokens</strong> — until you disconnect the
            integration, revoke access in your Google account, or ask us to delete them.
          </li>
        </ul>
      </Clause>

      <Clause id="security" heading="11. Security">
        <p>
          We protect the Platform with encrypted connections (HTTPS/TLS), cryptographic
          hashing of account passwords, session-based access control, access controls on
          our database, and standard browser security headers.
          Credentials and API keys are held in server-side environment configuration and
          are never exposed to your browser.
        </p>
        <p>
          No system is perfectly secure. We continue to strengthen these safeguards, and we
          will notify you and the Data Protection Board of India of a personal data breach
          where the law requires it.
        </p>
      </Clause>

      <Clause id="rights" heading="12. Your rights">
        <p>
          Subject to the Digital Personal Data Protection Act, 2023, you have the right to:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            obtain a summary of the personal data we hold about you and how we process it;
          </li>
          <li>have inaccurate or incomplete data corrected, completed or updated;</li>
          <li>have your personal data erased, subject to our legal retention obligations;</li>
          <li>withdraw a consent you previously gave, at any time;</li>
          <li>
            nominate another person to exercise these rights on your behalf in the event of
            your death or incapacity;
          </li>
          <li>
            have a grievance addressed by us before approaching the Data Protection Board of
            India.
          </li>
        </ul>
        <p>
          The Platform does not currently provide a self-service account-deletion button. To
          exercise any of these rights, including deleting your account or your call
          transcripts, email{" "}
          <a href="mailto:privacy@egnitech.com" className="font-medium text-blue-700 underline">
            privacy@egnitech.com
          </a>{" "}
          from the address associated with your account or enquiry. We will respond within
          the period the law prescribes.
        </p>
      </Clause>

      <Clause id="children" heading="13. Children">
        <p>
          The Platform is intended for adults transacting in real estate and is not directed
          at children. We do not knowingly collect personal data from a child. If you
          believe a child has provided us with personal data, contact{" "}
          <a href="mailto:privacy@egnitech.com" className="font-medium text-blue-700 underline">
            privacy@egnitech.com
          </a>{" "}
          and we will delete it.
        </p>
      </Clause>

      <Clause id="cookies" heading="14. Cookies">
        <p>
          We use cookies that are strictly necessary to operate the Platform — principally
          to keep you signed in and to protect sign-in forms against cross-site request
          forgery. We do not use advertising or cross-site tracking cookies. Blocking
          essential cookies will prevent you from signing in.
        </p>
      </Clause>

      <Clause id="changes" heading="15. Changes to this policy">
        <p>
          We may update this policy as the Platform develops. We will change the effective
          date at the top of this page, and where the change is significant we will give
          notice through the Platform. Continuing to use the Platform after a change means
          you accept the updated policy.
        </p>
      </Clause>

      <Clause id="contact" heading="16. Contact and grievance redressal">
        <p>
          Egnitech, operator of Kyron Realty AI. Grievance contact:{" "}
          <a href="mailto:privacy@egnitech.com" className="font-medium text-blue-700 underline">
            privacy@egnitech.com
          </a>
          .
        </p>
        <p>
          If you are not satisfied with our response, you may complain to the Data
          Protection Board of India.
        </p>
      </Clause>
    </LegalLayout>
  );
}
