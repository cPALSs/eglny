/** Festival cuisine lanes + dish-type browse for the public food menu. */

/** Dish-type sections for default “By type” browse (meals + format). */
export const DISH_TYPE_ORDER = [
  "rice_plates_bowls",
  "fast_handheld",
  "noodle_wok_soup",
  "bbq_smoke_carved",
  "snacks",
  "sweets",
  "drinks",
];

export const DISH_TYPE_LABELS = {
  rice_plates_bowls: "Rice plates & bowls",
  fast_handheld: "Fast handhelds",
  noodle_wok_soup: "Noodles & soups",
  bbq_smoke_carved: "BBQ & carved meats",
  snacks: "Savory snacks",
  sweets: "Sweets",
  drinks: "Drinks",
};

/** Meal dish-type ids (format snacks/sweets/drinks come from category). */
export const MEAL_DISH_TYPE_IDS = [
  "rice_plates_bowls",
  "fast_handheld",
  "noodle_wok_soup",
  "bbq_smoke_carved",
];

/** Cultural cuisine lanes for By cuisine (format categories like drinks are By type only). */
export const CUISINE_ORDER = [
  "vietnamese",
  "chinese",
  "filipino",
  "lao_thai",
  "hmong",
  "japanese_korean",
  "asian",
  "mexican_latin",
  "mediterranean",
  "italian",
  "french",
  "american",
  "fusion",
  "other",
];

export const CUISINE_LABELS = {
  vietnamese: "Vietnamese",
  chinese: "Chinese",
  filipino: "Filipino",
  lao_thai: "Lao / Thai",
  hmong: "Hmong",
  japanese_korean: "Japanese / Korean",
  asian: "Asian",
  mexican_latin: "Mexican / Latin",
  mediterranean: "Mediterranean",
  italian: "Italian",
  french: "French",
  american: "American / fair classics",
  fusion: "Fusion",
  other: "Other",
};

/** Meal-only cuisine ids (snacks/sweets/drinks are format sections). */
export const MEAL_CUISINE_IDS = [
  "vietnamese",
  "chinese",
  "filipino",
  "lao_thai",
  "hmong",
  "japanese_korean",
  "asian",
  "mexican_latin",
  "mediterranean",
  "italian",
  "french",
  "american",
  "fusion",
  "other",
];

/** Drink subgroups under the Drinks format section (By cuisine view). */
export const DRINK_SUBCATEGORY_ORDER = ["coffee", "tea", "others"];

export const DRINK_SUBCATEGORY_LABELS = {
  coffee: "Coffee",
  tea: "Tea",
  others: "Others",
};

const DRINK_SUBCATEGORY_IDS = new Set(DRINK_SUBCATEGORY_ORDER);

const DRINK_COFFEE_RE =
  /\b(coffee|c[aà]\s*ph[eê]|espresso|cappuccino|macchiato|cold\s*brew|americano)\b/i;
/** Bare latte (no tea) → coffee; “milk tea latte” stays tea via tea rule first. */
const DRINK_LATTE_RE = /\blatte\b/i;
const DRINK_TEA_RE =
  /\b(tea|boba|bubble\s*tea|matcha|chai|milk\s*tea)\b/i;

/** Specific Asian lanes — preferred over pan-Asian when vendor disambiguates. */
const SPECIFIC_ASIAN_IDS = new Set([
  "vietnamese",
  "chinese",
  "filipino",
  "lao_thai",
  "hmong",
  "japanese_korean",
]);

/** Item-name rules — most specific first. */
const ITEM_RULES = [
  [
    "vietnamese",
    // Avoid trailing \b — breaks on Vietnamese diacritics (bánh mì, chè, etc.).
    // No trailing \b on diacritic tokens (chè, phở) — JS word boundaries break on them.
    /(?:^|[^A-Za-z])(ph[oở]|b[aá]nh\s*m[iì]|b[aá]nh\s*tr[aá]ng|b[aá]nh\s*x[eẻ]o|c[oơ]m\b|b[uú]n\b|h[uủ]\s*ti[eế]u|ch[aả]\s*gi[oò]|g[oỏ]i\s*cu[oố]n|ch[eè]|viet(?:namese)?(?:\s+coffee|\s+iced)?|c[aà]\s*ph[eê]|bo\s*luc\s*lac|b[oò]\s*l[uú]c\s*l[aá]c|lemongrass\s+(steak|chicken|pork)|bun\s*bo)/i,
  ],
  [
    "hmong",
    /\b(hmong(?:\s+sausage)?|purple\s+sticky\s+rice(?:\s+plate)?)\b/i,
  ],
  [
    "lao_thai",
    /\b(pad\s*thai|papaya\s*salad|som\s*tum|lao\s+sausage|larb|laab|tom\s*yum|green\s*curry|panang|thai\s+(tea|ice\s*tea|iced\s*tea|basil)|khao\s*(poon|piak)|phat\s*(kengo|paa\s*pao)|chicken\s+basil|basil\s+with\s+fried\s+egg)\b/i,
  ],
  [
    "filipino",
    /\b(sisig|lumpia|turon|tapa|tocino|lechon|adobo|longanisa|longganisa|pancit|halo[\s-]?halo|calamansi|ube\b|buko|pandan|sago|puto|balut|gang\s*wangs?)\b/i,
  ],
  [
    "chinese",
    /\b(chow\s*mein|orange\s*chicken|general\s*tso|kung\s*pao|mongolian|siu\s*mai|dim\s*sum|wonton|lo\s*mein|tanghulu|chinese)\b/i,
  ],
  [
    "japanese_korean",
    /\b(teriyaki|katsu|bulgogi|korean\s+corn\s*dogs?|korean\s+cheesedogs?|cheese\s*dogs?|ramen|sushi|gyoza|bibimbap|tonkatsu|japchae|korean\s+bbq)\b/i,
  ],
  [
    "mexican_latin",
    /\b(tacos?|elote|carnitas|aguas?\b|horchata|pupusas?|nachos?|burrito|quesadillas?|tamales?|asada|churros?|fruit\s*cups?|corn\s*cups?|pitaya|mangonada|huaraches?)\b/i,
  ],
  [
    "mediterranean",
    /\b(gyros?|shawarma|falafel|hummus|(?:chicken|lamb)\s+over\s+rice)\b/i,
  ],
  [
    "italian",
    /\b(italian\s+gelato|gelato|italian\s+sorbet|sorbet(?:to)?|cannoli|tiramisu|gelateria)\b/i,
  ],
  [
    "french",
    /\b(macarons?|macaroons?|croissant|crepes?|crêpes?|baguette|pain\s+au\s+chocolat)\b/i,
  ],
  [
    "american",
    /\b(funnel\s*cakes?|potato\s*swirls?|turkey\s*legs?|loaded\s*fries|garlic\s*fries|french\s*fries|corn\s*dogs?|hot\s*dogs?|tri[\s-]?tip|brisket|pulled\s*pork|spareribs|spare\s*ribs|(?:bbq\s+)?(?:beef\s+or\s+pork\s+)?ribs\b|hot\s*links?|hotlinks?|jambalaya|dirty\s*rice|mac\s*&\s*cheese|mac\s*and\s*cheese|collard\s*greens|gumbo|southern\s+fried|fried\s+or\s+baked\s*chicken|baked\s*potato|wings?\b|drumstick|chicken\s*legs?|polish|cajun|cotton\s*candy|soft\s*serve|milkshakes?|root\s*beer\s*floats?|(?:root\s*beer\s+)?floats?|lemonades?|popcorn|jerky|freeze[\s-]?dried\s+candy|smash\s*burgers?|cheeseburgers?|burgers?|pizza)\b/i,
  ],
  ["fusion", /\bfusion\b/i],
];

/**
 * Pan-Asian generics (DoorDash-style “Asian”) — after specific cuisine rules.
 * Prefer a specific Asian vendor lane when the name is also ambiguous.
 */
const ASIAN_GENERIC_RE =
  /\b(fried\s*rice|noodle\s*soup|sticky\s*rice|garlic\s*noodles?|asian\s+sausages?|curry\s+noodles?(?:\s+soup)?|fried\s+egg\s*(?:&|and)\s*steamed\s*rice|dragon\s*roll|kabobs?\s*sticks?|kebabs?\s*sticks?|pork\s+kabobs?(?:\s*sticks?)?|steamed\s*rice|rice\s*plates?|(?:spam\s+)?musubi|lunar\s+new\s+year|cookies?\s+and\s+pastries|boba(?:\s*tea)?|milk\s*tea|fruit\s+(?:green\s+)?tea|green\s+tea|herbal\s+tea|sugarcane|mango\s+drink|mango\s+milk\s*tea)\b|^pork\s+belly(?:\s+over\s+rice)?$/i;

/** Commodity sides — never inherit vendor cuisine. */
const COMMODITY_SIDE_RE =
  /^(bottled\s+)?water$|^canned\s+soda$|^soda$|^(bottled\s+water|canned\s+soda)(\s*&\s*canned\s+soda)?$/i;

/**
 * Generic dish names where vendor is useful for disambiguation
 * (e.g. “Skewers” at Lien’s Chinese → Chinese).
 */
const AMBIGUOUS_DISH_PATTERNS = [
  /^(rice\s*plates?|noodles?|noodle\s*soup|fried\s*rice|skewers?|sausages?|meatballs?|wings?|fries|plates?|bowls?|combo|special|egg\s*rolls?)$/i,
  /rice\s+plates?$/i,
  /^(pork|chicken|beef|shrimp)([,&\s]+(pork|chicken|beef|shrimp))*\s*(&|and)?\s*(skewers?|sausages?|wings?)$/i,
  /^beef\s+sausages?$/i,
  /^(pork|chicken)\s*&\s*(chicken|beef|pork)\s+skewers?$/i,
  /^pork,\s*chicken\s*&\s*beef\s+skewers?$/i,
];

/** Vendor-name hints — only when the item name is ambiguous / pan-Asian generic. */
const VENDOR_RULES = [
  ["chinese", /lien'?s\s*chinese|\bchinese\b|pop\s*berry/i],
  ["filipino", /filipin|sisig|lumpia|lechon|baboy|pinorrito|rhome|gim\s*belly|fairy\s*bites/i],
  ["hmong", /myzz\s*piggy|tiger\s*bite|\bhmong\b/i],
  ["lao_thai", /papaya\s*salad|thai\b|lao\b|stockton'?s\s*best/i],
  ["mexican_latin", /pitayas?\s*locas|elote|taco|mexican|latin|\bmaiz\b/i],
  ["mediterranean", /ray'?s\s*kitchen|gyro|shawarma|halal\s*kitchen/i],
  ["italian", /veneto|gelato|gelateria|\bitalian\b/i],
  ["french", /chez\s*chibi|patisserie|pâtisserie|\bfrench\b/i],
  ["japanese_korean", /\bkorean\b|teriyaki|ramen|bowli/i],
  ["vietnamese", /viet|saigon|\bpho\b|b[aá]nh|zummi|tri[\s-]?foods/i],
  ["fusion", /\bfusion\b/i],
  [
    "american",
    /southern|soul\s*food|low\s*&\s*slow|\bbbq\b|barbecue|aroma\s*concessions|potato\s*swirl|rowe'?s|pizza\s*lovers|lizetta|ya\s*ya'?s|jerky\s*jerky|purrfect\s*popcorn|mr\s*pops|next\s*gen\s*lemonade/i,
  ],
  ["asian", /bobette|boba\s*meet|hey\s*mango/i],
];

function isCommoditySide(name) {
  return COMMODITY_SIDE_RE.test(String(name || "").trim());
}

/**
 * Dish-type name cues — most specific first (BBQ before bare “plate”).
 * Optional item.dish_type override wins when it is a known meal type id.
 */
const DISH_TYPE_ITEM_RULES = [
  [
    "bbq_smoke_carved",
    /\b(kalbi|short\s*ribs?|spareribs|spare\s*ribs|(?:beef\s+or\s+pork\s+)?ribs\b|lechon|brisket|tri[\s-]?tip|turkey\s*legs?|hot\s*links?|hotlinks?|smoke(?:d|house)?|carved)\b/i,
  ],
  [
    "noodle_wok_soup",
    /\b(garlic\s+noodles?|noodles?|noodle\s*soup|ramen|pho\b|ph[oở]|b[uú]n\b|h[uủ]\s*ti[eế]u|chow\s*mein|lo\s*mein|pad\s*thai|japchae|wonton\s*soup|tom\s*yum|curry\s+noodles?(?:\s+soup)?)\b/i,
  ],
  [
    "rice_plates_bowls",
    // Plates before handheld skewers so “sticky rice plate, meat skewers” stays plated.
    /\b(rice\s*plates?|over\s+rice|bowl|sticky\s+rice(?:\s+plate)?|fried\s*rice|steamed\s*rice|plates?\b|bibimbap)\b/i,
  ],
  [
    "fast_handheld",
    /\b(tacos?|burgers?|cheeseburgers?|smash\s*burgers?|gyros?|shawarma|b[aá]nh\s*m[iì]|(?:spam\s+)?musubi|sandwiches?|pizza|skewers?|kabobs?\s*sticks?|kebabs?\s*sticks?|corn\s*dogs?|hot\s*dogs?|cheese\s*dogs?)\b/i,
  ],
];

const DISH_TYPE_PLATE_RE =
  /\b(rice\s*plates?|over\s+rice|bowl|sticky\s+rice(?:\s+plate)?|fried\s*rice|steamed\s*rice|plates?\b|bibimbap)\b/i;
const DISH_TYPE_SKEWER_RE = /\b(skewers?|kabobs?|kebabs?)\b/i;

/**
 * Resolve primary dish-type section for By type browse.
 * Format categories win; then optional dish_type; then name cues; meals default to rice plates.
 * Prefer {@link dishTypeSectionsForItem} when an item can appear in more than one section.
 * @param {{ name?: string, category?: string, dish_type?: string }} item
 * @returns {string}
 */
export function classifyDishType(item) {
  const category = String(item?.category || "meals").trim().toLowerCase();
  if (category === "snacks") return "snacks";
  if (category === "sweets") return "sweets";
  if (category === "drinks" || isCommoditySide(item?.name)) return "drinks";

  const override = String(item?.dish_type || "").trim();
  if (MEAL_DISH_TYPE_IDS.includes(override)) return override;

  const name = String(item?.name || "");
  for (const [id, re] of DISH_TYPE_ITEM_RULES) {
    if (re.test(name)) return id;
  }

  // Unclassified meals → rice plates (most festival mains are plated).
  return "rice_plates_bowls";
}

/**
 * Sections an item belongs to in By type view.
 * Rice plates that also name skewers/kabobs double-list under BBQ & carved meats
 * (plated + grilled stick food).
 * @param {{ name?: string, category?: string, dish_type?: string }} item
 * @returns {string[]}
 */
export function dishTypeSectionsForItem(item) {
  const primary = classifyDishType(item);
  if (primary === "snacks" || primary === "sweets" || primary === "drinks") {
    return [primary];
  }

  const name = String(item?.name || "");
  if (DISH_TYPE_PLATE_RE.test(name) && DISH_TYPE_SKEWER_RE.test(name)) {
    const sections = ["rice_plates_bowls", "bbq_smoke_carved"];
    // Keep primary first if it was something else (e.g. explicit dish_type).
    if (!sections.includes(primary)) sections.unshift(primary);
    return sections;
  }

  return [primary];
}

function isAmbiguousDishName(name) {
  const n = String(name || "").trim();
  if (!n || isCommoditySide(n)) return false;
  return AMBIGUOUS_DISH_PATTERNS.some((re) => re.test(n));
}

function isAsianGenericName(name) {
  return ASIAN_GENERIC_RE.test(String(name || "").trim());
}

function vendorCuisine(vendorName, { specificAsianOnly = false } = {}) {
  for (const [id, re] of VENDOR_RULES) {
    if (specificAsianOnly && !SPECIFIC_ASIAN_IDS.has(id)) continue;
    if (re.test(vendorName)) return id;
  }
  return null;
}

/**
 * Resolve meal cuisine lane (not snacks/drinks format buckets).
 * Item name first; vendor only to disambiguate generic dish names.
 * Pan-Asian generics → Asian (DoorDash-style), unless a specific Asian vendor applies.
 * Unclassified meals → Other. Fusion only when name/vendor/item says so.
 * Never inherit vendor cuisine for commodity sides (bottled water, canned soda).
 * @param {{ name?: string, category?: string, cuisine?: string }} item
 * @param {{ name?: string, cuisine?: string }} [vendor]
 */
export function classifyCuisine(item, vendor = {}) {
  // Item-level override only — do not blanket-apply vendor.cuisine to every line.
  if (item?.cuisine && MEAL_CUISINE_IDS.includes(item.cuisine)) return item.cuisine;
  // Legacy combined id
  if (item?.cuisine === "fusion_other") return "other";

  const name = String(item?.name || "");
  const vendorName = String(vendor?.name || "");

  if (isCommoditySide(name)) return "other";

  for (const [id, re] of ITEM_RULES) {
    if (re.test(name)) return id;
  }

  // Vendor is guidance for disambiguation, not a category stamp.
  if (isAmbiguousDishName(name)) {
    const fromVendor = vendorCuisine(vendorName);
    // Bare “Rice plates” are pan-Asian generics — don’t park them in Fusion
    // just because the booth is named Fusion Bites.
    if (fromVendor === "fusion" && /\brice\s*plates?\b/i.test(name)) {
      return "asian";
    }
    if (fromVendor) return fromVendor;
    if (/\brice\s*plates?\b/i.test(name)) return "asian";
  }

  // DoorDash-style pan-Asian bucket for generics (fried rice, sticky rice, …).
  if (isAsianGenericName(name)) {
    return vendorCuisine(vendorName, { specificAsianOnly: true }) || "asian";
  }

  return "other";
}

/**
 * Coffee / Tea / Others under the Drinks section.
 * Prefer explicit item.subcategory; else infer from name (legacy years without the field).
 * @param {{ name?: string, subcategory?: string, category?: string }} item
 * @returns {"coffee"|"tea"|"others"}
 */
export function classifyDrinkSubcategory(item) {
  const raw = String(item?.subcategory || "")
    .trim()
    .toLowerCase();
  if (DRINK_SUBCATEGORY_IDS.has(raw)) return raw;

  const name = String(item?.name || "").trim();
  if (DRINK_TEA_RE.test(name) && !DRINK_COFFEE_RE.test(name)) return "tea";
  if (DRINK_COFFEE_RE.test(name)) return "coffee";
  if (DRINK_LATTE_RE.test(name) && !DRINK_TEA_RE.test(name)) return "coffee";
  if (DRINK_TEA_RE.test(name)) return "tea";
  return "others";
}

/**
 * Sections an item belongs to in By cuisine view.
 * Culture only — snacks / sweets / drinks are format (By type), not cuisine headings.
 * No cuisine → **Other**. Named drinks still file by culture when known (e.g. Vietnamese coffee).
 * @returns {string[]}
 */
export function cuisineSectionsForItem(item, vendor = {}) {
  return [classifyCuisine(item, vendor)];
}

/** Max length for public item notes (translation / flavors). */
export const ITEM_NOTE_MAX_LEN = 100;
