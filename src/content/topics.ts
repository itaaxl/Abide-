/**
 * Curated topic -> passage mappings (seed content). Used by Discover, by the
 * guidance retrieval step, and as the clearly-labelled fallback when AI is
 * unavailable. References use World English Bible numbering and are validated
 * in tests/content.test.ts. Notes are original editorial summaries.
 */
export interface Topic {
  slug: string;
  label: string;
  description: string;
  keywords: string[];
  passages: { ref: string; note: string }[];
}

export const TOPICS: Topic[] = [
  {
    slug: "anxiety",
    label: "Anxiety and worry",
    description: "Passages about bringing worries to God and finding peace.",
    keywords: ["anxious", "anxiety", "worry", "worried", "stress", "stressed", "panic", "nervous", "overwhelmed", "afraid"],
    passages: [
      { ref: "PHP.4.6-7", note: "Prayer with thanksgiving and a peace that guards the heart." },
      { ref: "MAT.6.25-34", note: "Jesus on God’s care for birds, flowers, and people." },
      { ref: "1PE.5.6-7", note: "Casting worries on God because he cares." },
      { ref: "PSA.94.18-19", note: "God’s comfort when anxious thoughts multiply." },
      { ref: "JHN.14.27", note: "The peace Jesus gives, unlike the world’s." },
      { ref: "ISA.26.3", note: "Perfect peace for a mind that trusts God." },
    ],
  },
  {
    slug: "grief",
    label: "Grief and loss",
    description: "Comfort and honest lament for seasons of loss.",
    keywords: ["grief", "grieving", "loss", "died", "death", "mourning", "funeral", "lost", "miss"],
    passages: [
      { ref: "PSA.34.18", note: "God near to the broken-hearted." },
      { ref: "JHN.11.32-36", note: "Jesus weeps with Mary and Martha." },
      { ref: "MAT.5.4", note: "Blessing for those who mourn." },
      { ref: "REV.21.3-4", note: "A future without tears, death, or pain." },
      { ref: "2CO.1.3-4", note: "The God of all comfort, who comforts us in affliction." },
      { ref: "PSA.13.1-6", note: "An honest lament that moves toward trust." },
    ],
  },
  {
    slug: "anger",
    label: "Anger",
    description: "Passages about slowing down, honest anger, and reconciliation.",
    keywords: ["anger", "angry", "rage", "furious", "mad", "irritated", "resentment", "bitter"],
    passages: [
      { ref: "JAS.1.19-20", note: "Quick to hear, slow to speak, slow to anger." },
      { ref: "EPH.4.26-27", note: "Being angry without letting it lead to sin." },
      { ref: "PRO.15.1", note: "A gentle answer turns away wrath." },
      { ref: "PSA.4.4", note: "Reflecting quietly instead of acting in anger." },
      { ref: "COL.3.8-13", note: "Putting off anger and putting on compassion." },
    ],
  },
  {
    slug: "forgiveness",
    label: "Forgiveness",
    description: "Receiving God’s forgiveness and learning to forgive others.",
    keywords: ["forgive", "forgiveness", "forgiven", "guilt", "guilty", "shame", "regret", "sin", "mistake"],
    passages: [
      { ref: "1JN.1.9", note: "Confession met with faithfulness and cleansing." },
      { ref: "PSA.103.8-12", note: "As far as the east is from the west." },
      { ref: "EPH.4.31-32", note: "Forgiving as God in Christ forgave." },
      { ref: "MAT.18.21-22", note: "Jesus on forgiving again and again." },
      { ref: "LUK.15.11-24", note: "The father who runs to welcome his son home." },
      { ref: "PSA.51.1-12", note: "A prayer for mercy and a clean heart." },
    ],
  },
  {
    slug: "motivation",
    label: "Motivation and perseverance",
    description: "Encouragement to keep going when you feel weary.",
    keywords: ["motivation", "motivated", "tired", "lazy", "give up", "quit", "weary", "persevere", "discipline", "goals"],
    passages: [
      { ref: "GAL.6.9", note: "Do not grow weary in doing good." },
      { ref: "ISA.40.28-31", note: "Strength renewed for those who wait on Yahweh." },
      { ref: "HEB.12.1-3", note: "Running with endurance, looking to Jesus." },
      { ref: "PHP.3.12-14", note: "Pressing on toward the goal." },
      { ref: "COL.3.23-24", note: "Working wholeheartedly, as for the Lord." },
    ],
  },
  {
    slug: "gratitude",
    label: "Gratitude",
    description: "Practising thankfulness in every season.",
    keywords: ["grateful", "gratitude", "thankful", "thanks", "thanksgiving", "blessed", "praise"],
    passages: [
      { ref: "PSA.100.1-5", note: "Entering God’s gates with thanksgiving." },
      { ref: "1TH.5.16-18", note: "Giving thanks in all circumstances." },
      { ref: "PSA.103.1-5", note: "Do not forget all his benefits." },
      { ref: "COL.3.15-17", note: "Letting thankfulness shape words and actions." },
      { ref: "JAS.1.17", note: "Every good gift comes from above." },
    ],
  },
  {
    slug: "relationships",
    label: "Relationships",
    description: "Love, patience, and reconciliation with others.",
    keywords: ["relationship", "marriage", "friend", "friendship", "family", "parents", "spouse", "conflict", "lonely", "loneliness", "husband", "wife"],
    passages: [
      { ref: "1CO.13.4-7", note: "What love does and refuses to do." },
      { ref: "ROM.12.9-18", note: "Genuine love and living at peace with others." },
      { ref: "COL.3.12-14", note: "Compassion, patience, and forgiveness." },
      { ref: "ECC.4.9-12", note: "Two are better than one." },
      { ref: "PHP.2.3-4", note: "Looking to the interests of others." },
      { ref: "PRO.17.17", note: "A friend loves at all times." },
    ],
  },
  {
    slug: "closer-to-god",
    label: "Growing closer to God",
    description: "Seeking God through prayer, Scripture, and abiding.",
    keywords: ["closer", "god", "faith", "pray", "prayer", "relationship with god", "spiritual", "seek", "distant", "dry"],
    passages: [
      { ref: "JAS.4.8", note: "Draw near to God, and he will draw near to you." },
      { ref: "JHN.15.4-5", note: "Abiding in the vine." },
      { ref: "PSA.63.1-8", note: "Thirsting for God in a dry land." },
      { ref: "JER.29.12-13", note: "Seeking God with all your heart." },
      { ref: "MAT.7.7-8", note: "Ask, seek, knock." },
      { ref: "PSA.42.1-5", note: "A soul that thirsts for God, even when discouraged." },
    ],
  },
  {
    slug: "hope",
    label: "Hope",
    description: "Hope rooted in God’s faithfulness.",
    keywords: ["hope", "hopeless", "future", "despair", "discouraged", "waiting"],
    passages: [
      { ref: "ROM.15.13", note: "The God of hope fills with joy and peace." },
      { ref: "LAM.3.21-26", note: "Mercies new every morning." },
      { ref: "ROM.8.18-28", note: "Present sufferings and future glory." },
      { ref: "HEB.6.19", note: "Hope as an anchor for the soul." },
      { ref: "PSA.42.11", note: "Why are you in despair, my soul? Hope in God." },
    ],
  },
  {
    slug: "peace",
    label: "Peace",
    description: "The peace God gives and the call to make peace.",
    keywords: ["peace", "calm", "rest", "quiet", "still", "restless"],
    passages: [
      { ref: "JHN.14.27", note: "Peace Jesus leaves with his followers." },
      { ref: "PSA.23.1-6", note: "The shepherd who leads beside still waters." },
      { ref: "ISA.26.3-4", note: "Perfect peace through trust." },
      { ref: "MAT.11.28-30", note: "Rest for the weary." },
      { ref: "PSA.46.1-11", note: "Be still, and know that I am God." },
    ],
  },
  {
    slug: "love",
    label: "Love",
    description: "God’s love and the call to love others.",
    keywords: ["love", "loved", "unloved", "loving"],
    passages: [
      { ref: "1JN.4.7-12", note: "God is love, and love comes from God." },
      { ref: "ROM.8.35-39", note: "Nothing can separate us from God’s love." },
      { ref: "JHN.3.16-17", note: "God so loved the world." },
      { ref: "1CO.13.1-13", note: "The way of love." },
      { ref: "JHN.15.12-13", note: "Love one another as I have loved you." },
    ],
  },
  {
    slug: "wisdom",
    label: "Wisdom and decisions",
    description: "Seeking God’s guidance in choices.",
    keywords: ["wisdom", "decision", "choose", "choice", "direction", "career", "job", "confused", "guidance", "unsure"],
    passages: [
      { ref: "JAS.1.5-6", note: "Ask God for wisdom; he gives generously." },
      { ref: "PRO.3.5-6", note: "Trust with all your heart." },
      { ref: "PSA.32.8", note: "I will instruct you and teach you the way." },
      { ref: "PRO.16.3", note: "Commit your works to Yahweh." },
      { ref: "PSA.119.105", note: "A lamp to my feet." },
    ],
  },
  {
    slug: "courage",
    label: "Courage and fear",
    description: "Facing fear with the promise of God’s presence.",
    keywords: ["fear", "afraid", "scared", "courage", "brave", "frightened", "terrified"],
    passages: [
      { ref: "JOS.1.9", note: "Be strong and courageous; God is with you." },
      { ref: "ISA.41.10", note: "Do not be afraid, for I am with you." },
      { ref: "PSA.27.1-3", note: "Yahweh is my light and salvation." },
      { ref: "2TI.1.7", note: "Not a spirit of fear, but of power, love, and self-control." },
      { ref: "DEU.31.6", note: "He will not fail you nor forsake you." },
    ],
  },
  {
    slug: "doubt",
    label: "Doubt and questions",
    description: "Honest questions held within faith.",
    keywords: ["doubt", "doubts", "question", "questions", "unsure", "believe", "unbelief", "struggling to believe"],
    passages: [
      { ref: "MRK.9.23-24", note: "I believe. Help my unbelief!" },
      { ref: "JHN.20.24-29", note: "Jesus meets Thomas in his doubt." },
      { ref: "PSA.13.1-6", note: "How long? An honest psalm." },
      { ref: "JUD.1.22", note: "Have mercy on those who doubt." },
      { ref: "HAB.1.2-4", note: "A prophet’s honest complaint to God." },
    ],
  },
  {
    slug: "strength",
    label: "Strength in weakness",
    description: "God’s strength when we feel weak.",
    keywords: ["weak", "weakness", "strength", "strong", "sick", "illness", "pain", "suffering", "exhausted"],
    passages: [
      { ref: "2CO.12.9-10", note: "Power made perfect in weakness." },
      { ref: "ISA.40.29-31", note: "He gives power to the weak." },
      { ref: "PSA.73.26", note: "God is the strength of my heart." },
      { ref: "PHP.4.12-13", note: "Strength in every circumstance." },
      { ref: "NEH.8.10", note: "The joy of Yahweh is your strength." },
    ],
  },
];
