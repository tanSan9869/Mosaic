// Little Joys product + guidance data.
// In the real product this would come from Mosaic's product database;
// here it's hard-coded for the prototype's two pilot products
// (one staple, one snack) as specified in the Part 2 scope.

const PRODUCTS = [
  {
    id: "millet-noodles",
    kind: "staple",
    name: "Millet Noodles",
    tagline: "A wheat-swap staple for everyday meals",
    contains: ["gluten-free millet", "no maida", "iron + fibre"],
    avoidFlags: [], // does not conflict with any avoid-tag below
    minAgeMonths: 12,
    servings: {
      "6-12m": null, // not suitable — handled by logic
      "1-3y": { amount: "half a cup, cooked", perWeek: "3–4 times a week", prep: "Cook 4–5 minutes, drain, stir in a teaspoon of ghee or oil before serving so strands don't stick." },
      "4-8y": { amount: "one cup, cooked", perWeek: "4–5 times a week", prep: "Cook 4–5 minutes. Use the tastemaker sachet sparingly for this age — about half the sachet — and add vegetables for the rest of the flavour." },
      "9-12y": { amount: "1–1.5 cups, cooked", perWeek: "most days, as part of a varied diet", prep: "Cook 4–5 minutes. Full tastemaker sachet is fine; pair with a protein side for a fuller meal." }
    },
    tastemakerNote: "The tastemaker sachet is seasoning, not a serving requirement — you can use less, or none, and add your own vegetables or dal instead.",
    lowSaltNote: "If you're keeping sodium low, skip the tastemaker sachet entirely and season with a pinch of your own salt plus herbs.",
  },
  {
    id: "veggie-puffs",
    kind: "snack",
    name: "Veggie Puffs",
    tagline: "A between-meals snack with hidden vegetables",
    contains: ["pumpkin", "spinach", "carrot", "baked, not fried"],
    avoidFlags: [],
    minAgeMonths: 8,
    servings: {
      "6-12m": { amount: "4–5 puffs", perWeek: "as an occasional snack, 2–3 times a week", prep: "Offer seated and supervised. These soften quickly — fine for early self-feeding." },
      "1-3y": { amount: "a small handful (approx. 10 puffs)", perWeek: "most days, as one snack slot", prep: "Good for lunchboxes — no refrigeration needed." },
      "4-8y": { amount: "a small bowl (approx. 15–18 puffs)", perWeek: "most days, as one snack slot", prep: "Pairs well with a fruit portion for a fuller snack." },
      "9-12y": { amount: "a bowl (approx. 20 puffs)", perWeek: "most days, as one snack slot", prep: "Can be a lunchbox snack as-is." }
    },
    tastemakerNote: null,
    lowSaltNote: "These are lightly salted at the factory — if salt needs to stay low, treat this as an occasional rather than daily snack.",
  }
];

function monthsForAgeBand(band) {
  return { "6-12m": 9, "1-3y": 24, "4-8y": 72, "9-12y": 126 }[band] ?? null;
}

function ageBandLabel(band) {
  return { "6-12m": "6–12 months", "1-3y": "1–3 years", "4-8y": "4–8 years", "9-12y": "9–12 years" }[band] ?? "your child's age";
}

// Core suitability logic used on the product guidance screen.
// Returns { verdict: 'suitable' | 'caution' | 'too-young', reasons: [...] }
function getSuitability(product, profile) {
  if (!profile || !profile.ageBand) {
    return { verdict: "no-profile", reasons: [] };
  }
  const months = monthsForAgeBand(profile.ageBand);
  const reasons = [];

  if (months < product.minAgeMonths) {
    return {
      verdict: "too-young",
      reasons: [`This product is suited from ${Math.round(product.minAgeMonths / 12) || "under 1"} ${product.minAgeMonths >= 12 ? "year" : "month"}${product.minAgeMonths === 12 ? "" : "s"}+. At ${ageBandLabel(profile.ageBand)}, we'd hold off for now.`]
    };
  }

  const serving = product.servings[profile.ageBand];
  if (!serving) {
    return {
      verdict: "too-young",
      reasons: [`We don't yet have a serving guide for ${ageBandLabel(profile.ageBand)} for this product — best to check with your pediatrician before introducing it.`]
    };
  }

  const avoid = profile.avoid || [];
  let verdict = "suitable";

  if (avoid.includes("low-salt") && product.lowSaltNote) {
    verdict = "caution";
    reasons.push(product.lowSaltNote);
  }
  if (avoid.includes("low-sugar") && product.id === "veggie-puffs") {
    reasons.push("This snack is low in added sugar already, so it fits a low-sugar routine without changes.");
  }
  if (avoid.includes("gluten") && product.id === "millet-noodles") {
    reasons.push("Good news — these are made with millet, not wheat, so they fit a gluten-avoiding diet.");
  }

  return { verdict, reasons, serving };
}
