// Pure-JS rules-based scam-message classifier.
// Designed to be swappable for an LLM call later. No side effects.

export type Verdict = "safe" | "suspicious" | "scam";

export interface Signal {
  id: string;
  label: string;
  weight: number; // 0-100 contribution
  excerpt?: string;
}

export interface TriageResult {
  verdict: Verdict;
  confidence: number; // 0-100
  signals: Signal[];
  recommendation: string;
}

interface Pattern {
  id: string;
  label: string;
  weight: number;
  test: RegExp;
}

// Curated indicators drawn from FTC/FBI elder-scam typologies.
const PATTERNS: Pattern[] = [
  // Payment rails scammers favor
  { id: "gift_card", label: "Asks for gift cards", weight: 40,
    test: /\b(gift\s?card|google\s?play|app\s?store|steam|itunes|amazon\s?card|ebay\s?card|target\s?card|vanilla)\b/i },
  { id: "wire", label: "Wire transfer / Zelle", weight: 35,
    test: /\b(wire\s?transfer|western\s?union|moneygram|zelle|cash\s?app|venmo\b(?!\s?friend)|bank\s?transfer)\b/i },
  { id: "crypto", label: "Cryptocurrency", weight: 40,
    test: /\b(bitcoin|btc|ethereum|usdt|crypto|coinbase|binance|wallet\s?address|bitcoin\s?atm)\b/i },

  // Impersonation
  { id: "gov_impersonation", label: "Government impersonation", weight: 35,
    test: /\b(irs|social\s?security|ssa|medicare|medicaid|sheriff|police|customs|cbp|treasury|tax\s?(office|agent)|warrant\s+(for|out))\b/i },
  { id: "tech_impersonation", label: "Tech-support impersonation", weight: 30,
    test: /\b(microsoft|apple|amazon|geek\s?squad|norton|mcafee|paypal|virus\s+detected|computer\s+(is\s+)?(infected|compromised))\b/i },
  { id: "bank_impersonation", label: "Bank fraud-department impersonation", weight: 30,
    test: /\b(fraud\s+department|suspicious\s+(charge|activity|login)|your\s+(account|card)\s+(has\s+been|is)\s+(locked|suspended|compromised))\b/i },
  { id: "family", label: "Family-emergency / grandparent scam", weight: 35,
    test: /\b(grandma|grandpa|grandson|granddaughter|your\s+(son|daughter|grandchild))\b.*\b(jail|arrested|hospital|accident|bail|stranded|kidnapped)\b/is },

  // Pressure
  { id: "urgency", label: "Extreme urgency", weight: 20,
    test: /\b(immediately|right\s?now|within\s+\d+\s+(minutes|hours)|before\s+(the\s+)?(end\s+of\s+)?(day|today)|final\s+notice|last\s+warning|act\s+now)\b/i },
  { id: "secrecy", label: "Demand for secrecy", weight: 25,
    test: /\b(don.?t\s+tell|do\s+not\s+tell|keep\s+(this|it)\s+(secret|between\s+us|confidential)|don.?t\s+(call|talk\s+to)\s+(anyone|your))\b/i },
  { id: "threat", label: "Threats (arrest / fines / lawsuit)", weight: 25,
    test: /\b(arrest|jail|prison|deport|lawsuit|sue\s+you|criminal\s+charges|legal\s+action)\b/i },

  // Romance / sweetheart
  { id: "romance", label: "Romance-scam phrasing", weight: 30,
    test: /\b(my\s+love|sweetheart|i\s+love\s+you).{0,80}\b(send|money|gift|help|loan|need|emergency)\b/is },

  // Lottery / prize
  { id: "prize", label: "Prize or sweepstakes claim", weight: 30,
    test: /\b(you.?ve\s+won|congratulations|sweepstakes|lottery|jackpot|claim\s+your\s+(prize|reward)|publishers?\s+clearing)\b/i },
  { id: "fee_to_claim", label: "Pay a fee to claim winnings", weight: 25,
    test: /\b(processing\s+fee|delivery\s+fee|tax\s+(payment|fee)\s+required|small\s+fee|advance\s+payment)\b/i },

  // Links & contact
  { id: "shortlink", label: "Shortened / unusual link", weight: 15,
    test: /\b(bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly)\b/i },
  { id: "odd_tld", label: "Suspicious link domain", weight: 10,
    test: /https?:\/\/[^\s]+\.(top|xyz|click|click|loan|work|country|click)\b/i },
  { id: "call_now", label: "Pressure to call a phone number", weight: 10,
    test: /\b(call\s+(us|now|immediately)|press\s+\d+|dial)\b.{0,30}(\+?\d[\d\s().-]{7,})/i },
];

export function triage(input: string): TriageResult {
  const text = (input || "").trim();
  if (!text) {
    return {
      verdict: "safe",
      confidence: 0,
      signals: [],
      recommendation: "Nothing to analyze yet. Paste a suspicious message, voicemail transcript, or email and we'll take a look.",
    };
  }

  const hits: Signal[] = [];
  for (const p of PATTERNS) {
    const m = text.match(p.test);
    if (m) {
      const idx = m.index ?? 0;
      const start = Math.max(0, idx - 20);
      const end = Math.min(text.length, idx + m[0].length + 20);
      hits.push({
        id: p.id,
        label: p.label,
        weight: p.weight,
        excerpt: text.slice(start, end).replace(/\s+/g, " ").trim(),
      });
    }
  }

  // Aggregate score with diminishing returns so one repeated theme doesn't pin it.
  const grouped = new Map<string, number>();
  for (const s of hits) {
    const key = s.id.split("_")[0];
    grouped.set(key, Math.max(grouped.get(key) ?? 0, s.weight));
  }
  const raw = Array.from(grouped.values()).reduce((a, b) => a + b, 0);
  const confidence = Math.min(100, raw);

  // Verdict bands
  let verdict: Verdict = "safe";
  if (confidence >= 55) verdict = "scam";
  else if (confidence >= 25) verdict = "suspicious";

  // Caregiver script
  const recommendation = scriptFor(verdict, hits);

  return { verdict, confidence, signals: hits, recommendation };
}

function scriptFor(verdict: Verdict, signals: Signal[]): string {
  const themes = new Set(signals.map((s) => s.id.split("_")[0]));
  const parts: string[] = [];

  if (verdict === "scam") {
    parts.push("This is almost certainly a scam. Tell them calmly: \"I looked at this — please don't reply, don't click anything, and don't send any money. It's a known scam.\"");
  } else if (verdict === "suspicious") {
    parts.push("This has multiple red flags. Walk through it with them before they act. Say: \"Hold on, let's look at this together — a few things in here are common scam patterns.\"");
  } else {
    parts.push("No strong scam signals. Still worth a 30-second check: confirm the sender through a known phone number, not the one in the message.");
  }

  if (themes.has("gift") || themes.has("wire") || themes.has("crypto")) {
    parts.push("No legitimate company, agency, or family member will ever ask to be paid in gift cards, wire transfer, or cryptocurrency. That alone is a giveaway.");
  }
  if (themes.has("gov")) {
    parts.push("The IRS, Social Security, and Medicare never call or text demanding payment or threatening arrest. They send letters.");
  }
  if (themes.has("family")) {
    parts.push("Call the family member directly on their known number to confirm. \"Grandparent scams\" use AI voice cloning now — hearing their voice is no longer proof.");
  }
  if (themes.has("urgency") || themes.has("threat") || themes.has("secrecy")) {
    parts.push("Urgency, threats, and \"don't tell anyone\" are the scammer's toolkit. Real institutions give you time and welcome a second opinion.");
  }

  return parts.join(" ");
}
