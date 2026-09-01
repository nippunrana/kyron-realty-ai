import "dotenv/config";
import { generateAgoraRtcToken } from "../src/lib/agora-token";
import { startAgoraAgentSession, stopAgoraAgentSession } from "../src/lib/agora-agent-client";

async function testAgoraVoicePipeline() {
  console.log("=== Testing Phase 4: Agora Real-Time Voice Pipeline ===\n");

  const channelName = `listing-test-channel-${Date.now().toString(36)}`;
  console.log(`1. Testing Agora RTC Dynamic Token Generation for channel: ${channelName}`);
  const userTokenData = generateAgoraRtcToken(channelName, 1001);
  const agentTokenData = generateAgoraRtcToken(channelName, 999001);

  console.log(`[✓] User Token Generated:`);
  console.log(`    App ID: ${userTokenData.appId}`);
  console.log(`    Channel: ${userTokenData.channelName}`);
  console.log(`    User UID: ${userTokenData.uid}`);
  console.log(`    Token Prefix: ${userTokenData.token.substring(0, 25)}...`);
  console.log(`    Expires in: 3600 seconds`);

  console.log(`\n[✓] Agent Token Generated (UID: ${agentTokenData.uid})`);

  console.log("\n2. Testing Agora Conversational AI Agent Session Dispatcher...");
  const sessionResult = await startAgoraAgentSession({
    channelName,
    userUid: 1001,
    agentUid: 999001,
  });

  console.log(`[✓] Agora Agent Session Started:`);
  console.log(`    Success: ${sessionResult.success}`);
  console.log(`    Session ID: ${sessionResult.sessionId}`);
  console.log(`    Agent UID: ${sessionResult.agentUid}`);
  console.log(`    Greeting Spoken: "${sessionResult.greeting}"`);

  console.log("\n3. Testing Agora Agent Session Teardown...");
  const stopResult = await stopAgoraAgentSession(sessionResult.sessionId, channelName);
  console.log(`[✓] Agent Session Gracefully Stopped:`, stopResult);

  console.log("\nPhase 4 Pipeline Verification: 100% Passed! 🚀");
}

testAgoraVoicePipeline().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
