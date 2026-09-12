import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatE164Phone } from "@/lib/agora-telephony";

async function runTestCall() {
  console.log("=== Kyron Realty AI — Twilio Outbound Call Test ===\n");

  // 1. Fetch user phone from DB to ensure DB lookup is wired correctly
  const [user] = await db
    .select({ name: users.name, email: users.email, phone: users.phone })
    .from(users)
    .where(eq(users.email, "nippun.rana@gmail.com"))
    .limit(1);

  if (!user || !user.phone) {
    console.error("Error: Could not find user with phone in DB.");
    process.exit(1);
  }

  const destinationPhone = formatE164Phone(user.phone);
  console.log(`Target Manager: ${user.name} (${user.email})`);
  console.log(`DB Phone:       ${user.phone} -> Formatted: ${destinationPhone}`);

  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim();

  if (!accountSid || !authToken || !fromNumber) {
    console.error("Error: Missing TWILIO credentials in .env");
    process.exit(1);
  }

  console.log(`Twilio Account: ${accountSid.slice(0, 6)}...${accountSid.slice(-4)}`);
  console.log(`Twilio Caller:  ${fromNumber}\n`);

  // 2. Prepare TwiML for test call
  const testTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" timeout="10" finishOnKey="#">
    <Say voice="Polly.Aditi" language="en-IN">
      Hello Nippun. This is Kyron Realty AI running a live test of your Twilio integration.
      A prospective tenant is currently on the line and would like to speak with you directly.
      Press 1 to connect to the conversation now, or press 2 if you are currently unavailable.
    </Say>
  </Gather>
  <Say voice="Polly.Aditi" language="en-IN">
    Thank you. This confirms your Twilio call and speech synthesis test was successful. Have a great day!
  </Say>
  <Hangup/>
</Response>`;

  // 3. Dispatch outbound call to Twilio REST API
  console.log(`Dialing ${destinationPhone} via Twilio Voice API...`);
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
  const bodyParams = new URLSearchParams({
    To: destinationPhone,
    From: fromNumber,
    Twiml: testTwiML,
  });

  const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const response = await fetch(twilioUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: bodyParams.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Twilio Call Failed (${response.status}):\n${errorText}`);
    process.exit(1);
  }

  const callData = (await response.json()) as { sid: string; status: string; direction: string; to: string };
  console.log(`\n Call successfully queued!`);
  console.log(`Call SID:       ${callData.sid}`);
  console.log(`Initial Status: ${callData.status}`);
  console.log(`Direction:      ${callData.direction}`);
  console.log(`To:             ${callData.to}`);
  console.log("\nYour phone should start ringing in a few moments. Please answer the call!\n");

  // 4. Poll status for up to 45 seconds so user has time to answer
  for (let i = 0; i < 15; i++) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    try {
      const statusRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callData.sid}.json`,
        {
          headers: { Authorization: `Basic ${basicAuth}` },
        }
      );
      if (statusRes.ok) {
        const statusData = (await statusRes.json()) as { status: string; duration?: string };
        console.log(`[Twilio Call Status]: ${statusData.status} (Duration: ${statusData.duration || 0}s)`);
        if (["completed", "busy", "no-answer", "canceled", "failed"].includes(statusData.status)) {
          console.log(`\nCall finished with status: ${statusData.status}`);
          break;
        }
      }
    } catch {
      // ignore polling errors
    }
  }

  process.exit(0);
}

runTestCall().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
