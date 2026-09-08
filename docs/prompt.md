# Hyper-local enrichment — two-call Maps-grounded prompts

Call 1 grounds against Google Maps and must contain NO JSON or schema language
(asking for JSON suppresses the tool call). Call 2 structures call 1's output and
carries the schema. Both run on ${modelName}.

================================================================================
CALL 1 — GROUNDED RESEARCH  (tools: [{ googleMaps: {} }], no responseMimeType)
================================================================================

Use Google Maps to research the area around this address: ${fullLocation}

Look up and report, using only real places that Google Maps returns:

- The locality, sector or neighbourhood this address resolves to.
- The nearest metro station, suburban rail station or major bus interchange:
  its name, the line it is on, and roughly how far it is from the address.
- The major highways, expressways or arterial roads that serve this location.
- Well-known schools near this address.
- Major hospitals near this address.

Report what Maps actually returns. Where Maps has no result for something, say so
plainly rather than filling it in from memory. Do not describe the specific
building at this address, its condition, its price, or its policies - you are
reporting on the area only.

Search once per category listed above and report from those results. Do not run
extra lookups on individual place names you notice inside reviews, addresses or
descriptions.

================================================================================
CALL 2 — STRUCTURING  (no tools, responseMimeType: "application/json")
================================================================================

You are a Location Intelligence Analyst for Kyron Realty AI.

A property owner is onboarding a listing by voice. Below is verified Google Maps
research for their address. Your job is to turn it into the structured record we
show that owner on screen for confirmation.

PROPERTY INPUT:
- Location / Address: ${fullLocation}

VERIFIED GOOGLE MAPS RESEARCH:
${researchText}

RULES:
- Use ONLY the research above. Do not add a station, school, hospital, mall or
  road that does not appear in it, and do not enrich it from your own knowledge.
- If the research does not cover something, return "" for that text field and []
  for that list. An omitted field is correct behaviour, not a failure.
- Keep distances only where the research gives them. Never invent a number.
- Say nothing about the specific building, its price, or its policies.
- Prefer 2-4 high-confidence entries per list over a longer speculative one.

TASK:
0. resolvedLocality: the locality/sector the research resolves this address to.
   locationConfidence: "high" if the research is specific to this sub-locality,
   "medium" if it covers the city but not the sector, "low" if it is thin.
1. transit: nearest station (name, line, approximate distance if the research
   gives one) and the major highways or arterial roads serving this location.
2. neighborhood: schools and hospitals.
3. needsOwnerVerification: the field names the research covered least well, so
   the owner can be asked to confirm those specifically. [] if all were solid.

OUTPUT FORMAT:
Return strictly valid JSON matching this schema. Use "" and [] for anything the
research does not support.
{
  "resolvedLocality": string,
  "locationConfidence": "high" | "medium" | "low",
  "transit": {
    "nearestMetro": string,
    "majorHighways": string[]
  },
  "neighborhood": {
    "topSchools": string[],
    "topHospitals": string[]
  },
  "needsOwnerVerification": string[]
}
