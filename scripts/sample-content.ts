// Realistic, plain-formatted source documents used to exercise the pipeline.
// Content is original business copy (not the brand guidelines) so we test a true
// transform. Each becomes a .docx or .pdf "standard document" input.

export interface SampleSection {
  heading: string;
  paras?: string[];
  bullets?: string[];
  stats?: { value: string; label: string }[];
}

export interface SampleDoc {
  name: string;
  format: "docx" | "pdf";
  title: string;
  subtitle?: string;
  sections: SampleSection[];
}

export const BATCH_1: SampleDoc[] = [
  {
    name: "campaign-brief",
    format: "docx",
    title: "Q3 Performance Campaign Brief",
    subtitle: "Paid social creative plan for the North American launch window.",
    sections: [
      {
        heading: "Objective",
        paras: [
          "Drive qualified installs for the mobile app across TikTok and Meta while holding blended CPA under target. The brief covers creative direction, audience segments, and the testing framework for the first six weeks.",
        ],
      },
      {
        heading: "Audience Segments",
        paras: ["We are prioritising three segments based on watch-behaviour analysis rather than lookalike guesswork."],
        bullets: [
          "Deal-seekers who follow discount and coupon creators.",
          "Routine-builders engaging with morning and productivity content.",
          "Switchers actively comparing competitor apps in-category.",
        ],
      },
      {
        heading: "Creative Angles",
        bullets: [
          "Problem-agitate hooks in the first two seconds.",
          "Native UGC that mirrors organic feed content.",
          "Data-led proof using real dashboard footage.",
        ],
      },
      {
        heading: "Targets",
        stats: [
          { value: "-32%", label: "Blended CPA" },
          { value: "3.4×", label: "Target ROAS" },
          { value: "45", label: "Assets in flight" },
        ],
      },
      {
        heading: "Measurement",
        paras: [
          "Each concept is mapped to a hook, an angle, and a segment so results are attributable. We review at day 7 and day 21, then scale the top quartile and retire the bottom quartile.",
        ],
      },
    ],
  },
  {
    name: "case-study",
    format: "docx",
    title: "Case Study: Scaling a DTC Supplement Brand",
    subtitle: "How audience-first creative cut acquisition cost in a saturated category.",
    sections: [
      {
        heading: "The Challenge",
        paras: [
          "The brand had plateaued at a ceiling where every new dollar of spend pushed CPA higher. Their creative leaned on competitor mimicry and studio-glossy production that audiences scrolled past.",
        ],
      },
      {
        heading: "The Approach",
        paras: ["We rebuilt the creative system around what their actual buyers watched, not what the category produced."],
        bullets: [
          "Mapped watch-behaviour across 40 adjacent creators.",
          "Rewrote hooks around real objections, not features.",
          "Shifted 70% of budget to native, phone-shot footage.",
        ],
      },
      {
        heading: "The Results",
        stats: [
          { value: "-47%", label: "CPA" },
          { value: "+182%", label: "CTR" },
          { value: "3.2×", label: "ROAS" },
        ],
      },
      {
        heading: "Why It Worked",
        paras: [
          "Performance followed relevance. When the creative stopped looking like advertising, watch time rose, CPMs fell, and the algorithm did the rest. The winning angles were then productised into a repeatable monthly bundle.",
        ],
      },
    ],
  },
  {
    name: "service-proposal",
    format: "pdf",
    title: "Service Proposal: Monthly Creative Partnership",
    subtitle: "A scoped engagement for always-on performance content.",
    sections: [
      {
        heading: "Scope",
        paras: [
          "A monthly retainer delivering platform-specific creative bundles, a full strategy document, and iterative testing support. Everything is built for the platform it lives on.",
        ],
      },
      {
        heading: "Deliverables",
        bullets: [
          "30 platform-native assets per month.",
          "Monthly creative strategy document.",
          "Weekly performance readouts and iteration notes.",
        ],
      },
      {
        heading: "Investment",
        stats: [
          { value: "30", label: "Assets / month" },
          { value: "48h", label: "First-draft turnaround" },
        ],
      },
      {
        heading: "Next Steps",
        paras: [
          "Approve the scope, complete the onboarding questionnaire, and book the kickoff call. First assets ship within ten business days of kickoff.",
        ],
      },
    ],
  },
  {
    name: "market-whitepaper",
    format: "docx",
    title: "The State of Performance Creative in 2026",
    subtitle: "Why the creative — not the media buy — is now the primary lever.",
    sections: [
      {
        heading: "Executive Summary",
        paras: [
          "Targeting has commoditised. With signal loss and automated bidding, the creative is the last controllable variable that meaningfully moves cost per acquisition. This paper outlines the shift and what it means for growth teams.",
        ],
      },
      {
        heading: "The Targeting Plateau",
        paras: [
          "As platforms consolidated audiences into broad automated delivery, the differences between advertisers collapsed onto one axis: the asset itself. The teams still winning are the ones treating creative as a research problem.",
        ],
      },
      {
        heading: "Audience Intelligence",
        paras: ["The highest-performing teams start from demand, not from the competitor set."],
        bullets: [
          "Study watch-behaviour to find latent objections.",
          "Segment by intent signals, not demographics alone.",
          "Treat every hook as a testable hypothesis.",
        ],
      },
      {
        heading: "Operating Model",
        paras: [
          "Volume without a system is noise. A durable operating model maps each concept to a hook, an angle, a segment, and a rationale, then lets performance decide what scales.",
        ],
      },
      {
        heading: "Outlook",
        stats: [
          { value: "70%", label: "Variance explained by creative" },
          { value: "2.1×", label: "Median lift from native format" },
        ],
      },
    ],
  },
  {
    name: "meeting-notes",
    format: "pdf",
    title: "Kickoff Meeting Notes",
    subtitle: "Internal — creative partnership onboarding.",
    sections: [
      {
        heading: "Attendees",
        bullets: ["Client: growth lead, brand manager.", "CONVRTD: strategy, creative director."],
      },
      {
        heading: "Decisions",
        bullets: [
          "Start with TikTok-first, Meta as secondary.",
          "Prioritise the switcher segment for month one.",
          "Weekly readouts every Thursday.",
        ],
      },
      {
        heading: "Action Items",
        bullets: [
          "Client to share brand assets and past top performers.",
          "CONVRTD to deliver the first concept board in five days.",
          "Both to confirm the measurement dashboard access.",
        ],
      },
      {
        heading: "Notes",
        paras: [
          "Team aligned that the creative should not look like an ad. Focus on native, phone-shot footage and objection-led hooks. Revisit budget split after the first test window.",
        ],
      },
    ],
  },
];

export const BATCH_2: SampleDoc[] = [
  {
    name: "b2-product-onepager",
    format: "docx",
    title: "Product One-Pager: Trend Intelligence Engine",
    subtitle: "Proprietary signal detection across TikTok and Meta.",
    sections: [
      { heading: "What It Does", paras: ["The engine surfaces emerging formats and hooks before they saturate, so creative ships while attention is cheap."] },
      { heading: "Capabilities", bullets: ["Real-time format tracking.", "Hook pattern clustering.", "Category-specific trend feeds."] },
      { heading: "Impact", stats: [{ value: "6d", label: "Lead time gained" }, { value: "+58%", label: "Early-format CTR" }] },
    ],
  },
  {
    name: "b2-quarterly-report",
    format: "docx",
    title: "Quarterly Business Review",
    subtitle: "Performance summary and next-quarter plan.",
    sections: [
      { heading: "Highlights", paras: ["Spend scaled efficiently while CPA held flat, validating the creative-first thesis across three accounts."] },
      { heading: "Metrics", stats: [{ value: "3.6×", label: "Blended ROAS" }, { value: "-21%", label: "CPA QoQ" }, { value: "120", label: "Assets shipped" }] },
      { heading: "Risks", bullets: ["Creative fatigue on top performers.", "Seasonal CPM inflation in Q4."] },
      { heading: "Plan", paras: ["Refresh the top quartile monthly, expand the switcher segment, and pilot a second category."] },
    ],
  },
  {
    name: "b2-sop-guide",
    format: "pdf",
    title: "Standard Operating Procedure: Creative Testing",
    subtitle: "How every concept moves from brief to scale.",
    sections: [
      { heading: "Intake", paras: ["Every concept enters with a hook, an angle, a segment, and a rationale documented in the brief."] },
      { heading: "Test Phase", bullets: ["Launch in an even-split test.", "Hold budget flat for seven days.", "Judge on cost per qualified action."] },
      { heading: "Scale Phase", bullets: ["Promote the top quartile.", "Retire the bottom quartile.", "Log learnings to the angle library."] },
    ],
  },
  {
    name: "b2-partner-pitch",
    format: "pdf",
    title: "Partnership Pitch: Agency Whitelabel",
    subtitle: "Creative production, under your brand.",
    sections: [
      { heading: "The Offer", paras: ["We produce platform-native performance creative that agencies deliver to their own clients, fully whitelabelled."] },
      { heading: "Why Partner", bullets: ["Expand capacity without hiring.", "Access trend intelligence.", "Keep margins with fixed bundle pricing."] },
      { heading: "Commercials", stats: [{ value: "40%", label: "Typical margin" }, { value: "10d", label: "Onboarding" }] },
    ],
  },
  {
    name: "b2-annual-letter",
    format: "docx",
    title: "Founder's Annual Letter",
    subtitle: "A note on where performance creative is heading.",
    sections: [
      { heading: "The Year Behind", paras: ["We spent the year proving a simple claim: the best ads do not look like ads, and the data now backs it at scale."] },
      { heading: "What We Learned", paras: ["Relevance compounds. When creative earns attention honestly, every downstream metric improves, and media efficiency follows."] },
      { heading: "The Year Ahead", bullets: ["Deepen audience intelligence.", "Expand into two new verticals.", "Keep restraint as the operating principle."] },
    ],
  },
];
