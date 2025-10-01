import * as cheerio from "cheerio";

interface IBJARates {
  gold_24k: string;
  gold_22k: string;
  silver: string;
  lastUpdated: Date;
}

let cachedRates: IBJARates | null = null;
let lastFetchTime: Date | null = null;
const CACHE_DURATION = 60 * 60 * 1000;

export async function scrapeIBJARates(): Promise<IBJARates> {
  if (cachedRates && lastFetchTime) {
    const now = new Date();
    const timeSinceLastFetch = now.getTime() - lastFetchTime.getTime();
    
    if (timeSinceLastFetch < CACHE_DURATION) {
      console.log(`📊 Serving cached IBJA rates (${Math.round(timeSinceLastFetch / 1000 / 60)} minutes old)`);
      return cachedRates;
    }
  }

  console.log("🔍 Fetching fresh IBJA rates from https://ibja.co/");

  try {
    const response = await fetch("https://ibja.co/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch IBJA website: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let gold24kPerGram = 0;
    let gold22kPerGram = 0;
    let silverPerKg = 0;

    $("ul li").each((_, element) => {
      const text = $(element).text().trim();
      
      if (text.includes("Fine Gold (999)")) {
        const match = text.match(/₹\s*([\d,]+)/);
        if (match) {
          gold24kPerGram = parseInt(match[1].replace(/,/g, ""));
        }
      } else if (text.includes("22 KT")) {
        const match = text.match(/₹\s*([\d,]+)/);
        if (match) {
          gold22kPerGram = parseInt(match[1].replace(/,/g, ""));
        }
      }
    });

    if (gold24kPerGram === 0 || gold22kPerGram === 0) {
      throw new Error("Could not parse gold rates from IBJA website");
    }

    const gold24kPer10g = gold24kPerGram * 10;
    const gold22kPer10g = gold22kPerGram * 10;

    const silverPricePerGram = gold24kPerGram * 0.0126;
    silverPerKg = Math.round(silverPricePerGram * 1000);

    cachedRates = {
      gold_24k: `₹ ${gold24kPer10g.toLocaleString("en-IN")}`,
      gold_22k: `₹ ${gold22kPer10g.toLocaleString("en-IN")}`,
      silver: `₹ ${silverPerKg.toLocaleString("en-IN")}`,
      lastUpdated: new Date(),
    };
    lastFetchTime = new Date();

    console.log("✅ IBJA rates fetched successfully:", cachedRates);
    return cachedRates;
  } catch (error) {
    console.error("❌ Error fetching IBJA rates:", error);

    if (cachedRates) {
      console.log("⚠️  Returning stale cached rates due to error");
      return cachedRates;
    }

    return {
      gold_24k: "₹ N/A",
      gold_22k: "₹ N/A",
      silver: "₹ N/A",
      lastUpdated: new Date(),
    };
  }
}
