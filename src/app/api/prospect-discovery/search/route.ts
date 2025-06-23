import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { OpenAI } from "openai";
import { logAudit, AuditActionType, AuditEntityType } from "@/lib/audit-logger";
import { ProspectType as PrismaProspectType, UserRole } from "@prisma/client";
import * as cheerio from "cheerio";
import { getRequestClientInfo } from "@/lib/server-util";

const GOOGLE_CSE_API_KEY = process.env.GOOGLE_CSE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

let openai: OpenAI | null = null;
if (OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });
} else {
  console.warn(
    "OPENAI_API_KEY is not set. Prospect discovery AI features will be disabled."
  );
}

// Helper to fetch and clean page content using cheerio
async function fetchPageText(url: string): Promise<string | null> {
  try {
    console.log(`Fetching page content for: ${url}`);
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      console.warn(
        `Failed to fetch ${url}: ${response.status} ${response.statusText}`
      );
      return null;
    }
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("text/html")) {
      console.warn(`Skipping non-HTML content for ${url}: ${contentType}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    $(
      'script, style, noscript, iframe, header, footer, nav, aside, form, [aria-hidden="true"], .sidebar, .ad, .advertisement, .popup, .modal, #sidebar, #footer, #header, .comments'
    ).remove();

    let mainText = "";
    const mainContentSelectors = [
      "article",
      "main",
      ".main-content",
      ".entry-content",
      "#content",
      "#main",
      ".post-content",
      ".page-content",
    ];
    for (const selector of mainContentSelectors) {
      if ($(selector).length) {
        $(selector)
          .find("p, div, h1, h2, h3, h4, li")
          .each((i, elem) => {
            mainText += $(elem).text().trim() + "\n";
          });
        if (mainText.trim()) break;
      }
    }

    if (!mainText.trim()) {
      $("body")
        .find("p, div, h1, h2, h3, h4, li")
        .each((i, elem) => {
          mainText += $(elem).text().trim() + "\n";
        });
    }
    if (!mainText.trim()) {
      mainText = $("body").text();
    }

    let text = mainText
      .replace(/\s\s+/g, " ")
      .replace(/\n\s*\n+/g, "\n")
      .trim();

    const MAX_TEXT_LENGTH = 12000;
    if (text.length > MAX_TEXT_LENGTH) {
      text =
        text.substring(0, MAX_TEXT_LENGTH) + "... (webpage content truncated)";
    }
    console.log(
      `Successfully fetched and parsed text for ${url} (length: ${text.length})`
    );
    return text;
  } catch (error) {
    console.error(`Error fetching/parsing page content for ${url}:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  let userIdForAudit: string | undefined;
  const { ipAddress, userAgent } = await getRequestClientInfo(); // Get client info once

  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userIdForAudit = session.user.id;

    if (!GOOGLE_CSE_API_KEY || !GOOGLE_CSE_ID || !openai) {
      console.error(
        "Missing API keys or OpenAI client not initialized for prospect discovery."
      );
      logAudit({
        userId: userIdForAudit,
        userName: session.user.name,
        userRole: session.user.role,
        action: AuditActionType.FAILED,
        entityType: AuditEntityType.SYSTEM,
        details: {
          error: "Discovery service misconfiguration: API keys missing.",
        },
        ipAddress,
        userAgent,
      });
      return NextResponse.json(
        { error: "Service configuration error. Please contact support." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { searchTerm, prospectTypeFilter, locationFilter } = body;

    if (
      !searchTerm ||
      typeof searchTerm !== "string" ||
      searchTerm.trim() === ""
    ) {
      return NextResponse.json(
        { error: "Search term is required and cannot be empty." },
        { status: 400 }
      );
    }

    let fullQuery = searchTerm.trim();
    if (prospectTypeFilter && prospectTypeFilter !== "ALL") {
      fullQuery += ` ${prospectTypeFilter.replace(/_/g, " ")}`;
    }
    if (locationFilter && locationFilter !== "ALL") {
      fullQuery += ` in ${locationFilter}`;
    }
    fullQuery += " contact address phone number email official website";

    logAudit({
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: AuditActionType.PROSPECT_DISCOVERY_SEARCH,
      entityType: AuditEntityType.SYSTEM,
      details: {
        query: fullQuery,
        originalSearch: searchTerm,
        typeFilter: prospectTypeFilter,
        locationFilter,
      },
      ipAddress,
      userAgent,
    });

    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_CSE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(fullQuery)}&num=5`;
    console.log("Google Search URL:", searchUrl);

    const googleSearchResponse = await fetch(searchUrl);
    if (!googleSearchResponse.ok) {
      const errorData = await googleSearchResponse
        .json()
        .catch(() => ({ errorDetails: "Unknown Google API error format." }));
      console.error(
        "Google Search API error:",
        googleSearchResponse.status,
        errorData
      );
      return NextResponse.json(
        {
          error: "Failed to fetch search results from Google.",
          details: errorData.error?.message || errorData.errorDetails,
        },
        { status: googleSearchResponse.status }
      );
    }
    const searchData = await googleSearchResponse.json();
    const searchItems = searchData.items || [];

    if (searchItems.length === 0) {
      return NextResponse.json({
        results: [],
        message: "No relevant web pages found for your query.",
      });
    }

    const structuredProspects: any[] = [];
    const prospectTypesEnumString =
      Object.values(PrismaProspectType).join("' | '");

    for (const item of searchItems.slice(0, 3)) {
      if (!item.link || typeof item.link !== "string") {
        console.warn("Skipping item with invalid link:", item);
        continue;
      }

      let normalizedUrl = item.link;
      try {
        const urlObj = new URL(item.link);
        if (urlObj.pathname !== "/" && urlObj.pathname.endsWith("/")) {
          normalizedUrl = item.link.slice(0, -1);
        }
      } catch (e) {
        // ignore invalid URLs for normalization
      }

      const pageText = await fetchPageText(normalizedUrl);

      let contextForAI = `Source URL: ${normalizedUrl}\nSearch result title: ${item.title || "N/A"}\nSearch result snippet: ${item.snippet || "N/A"}\n\n`;
      if (pageText && pageText.trim() !== "") {
        contextForAI += `Relevant content extracted from the webpage at ${normalizedUrl}:\n${pageText}`;
      } else {
        contextForAI += `Could not fetch, parse, or found no substantial text content from ${normalizedUrl}. Relying on snippet and title only.`;
      }

      if (contextForAI.length > 15000) {
        contextForAI =
          contextForAI.substring(0, 15000) +
          "... (overall context truncated for AI)";
      }

      try {
        console.log(
          `Sending to OpenAI for URL: ${normalizedUrl}. Context length: ${contextForAI.length}`
        );

        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are an AI assistant. Your task is to extract prospect information from the provided text for a pharmaceutical CRM.
              The text includes a source URL, a search result title, a snippet, and potentially extracted webpage content.
              Identify potential prospects such as doctors, clinics, hospitals, or pharmacies.
              For each distinct prospect found, provide its details as a JSON object. If multiple distinct prospects are found, return a JSON array of these objects.
              Each JSON object MUST strictly follow this schema:
              {
                "name": "string (full name of person or organization)",
                "prospectType": "enum (MUST be one of: '${prospectTypesEnumString}')",
                "specialization": "string | null (e.g., Cardiology, General Pharmacy)",
                "phone": "string (primary phone number, try to normalize to E.164 if possible, otherwise as found) | null",
                "email": "string (contact email) | null",
                "address": "string (full street address including city, state, pin if available) | null",
                "website": "string (official website URL if found, otherwise null) | null",
                "sourceUrl": "string (MUST be exactly the provided Source URL: ${normalizedUrl})"
              }
              If a field is not found, use null. Prioritize accuracy. If no clear prospect entity is found, return an empty JSON array [].
              Do NOT invent information. Only extract what is present or clearly implied by the text.
              The "sourceUrl" in your output MUST be exactly: ${normalizedUrl}.
              Ensure the entire response is a single valid JSON structure (either an array of objects or a single object if only one found, though an array is preferred even for one).`,
            },
            { role: "user", content: contextForAI },
          ],
          temperature: 0.1,
          max_tokens: 1500,
        });

        let rawResponseContent = completion.choices[0]?.message?.content;

        if (rawResponseContent) {
          console.log(
            `Raw OpenAI response for ${normalizedUrl}:`,
            rawResponseContent
          );

          let cleanedJsonString = rawResponseContent
            .replace(/^```json\s*/im, "")
            .replace(/\s*```$/, "")
            .trim();
          if (
            cleanedJsonString.startsWith("`") &&
            cleanedJsonString.endsWith("`")
          ) {
            cleanedJsonString = cleanedJsonString
              .substring(1, cleanedJsonString.length - 1)
              .trim();
          }

          const firstBracket = cleanedJsonString.indexOf("{");
          const firstSquareBracket = cleanedJsonString.indexOf("[");
          let start = -1;

          if (firstBracket === -1 && firstSquareBracket === -1) {
            console.warn(
              `No JSON object or array found in OpenAI response for ${normalizedUrl} after initial cleaning. String: ${cleanedJsonString}`
            );
            cleanedJsonString = "[]";
          } else {
            if (
              firstBracket !== -1 &&
              (firstSquareBracket === -1 || firstBracket < firstSquareBracket)
            )
              start = firstBracket;
            else start = firstSquareBracket;

            const lastBracket = cleanedJsonString.lastIndexOf("}");
            const lastSquareBracket = cleanedJsonString.lastIndexOf("]");
            let end = -1;

            if (
              lastBracket !== -1 &&
              (lastSquareBracket === -1 || lastBracket > lastSquareBracket)
            )
              end = lastBracket;
            else end = lastSquareBracket;

            if (start !== -1 && end !== -1 && end >= start) {
              cleanedJsonString = cleanedJsonString.substring(start, end + 1);
            } else {
              console.warn(
                `Could not reliably extract JSON structure from OpenAI response for ${normalizedUrl}. Cleaned: ${cleanedJsonString}`
              );
              cleanedJsonString = "[]";
            }
          }
          cleanedJsonString = cleanedJsonString.replace(
            /[\u200B-\u200D\uFEFF]/g,
            ""
          );

          console.log(
            `Cleaned OpenAI JSON string for ${normalizedUrl}:`,
            cleanedJsonString
          );

          try {
            let parsedResponse = JSON.parse(cleanedJsonString);
            if (!Array.isArray(parsedResponse)) {
              if (
                typeof parsedResponse === "object" &&
                parsedResponse !== null &&
                parsedResponse.name
              ) {
                parsedResponse = [parsedResponse];
              } else {
                console.warn(
                  `OpenAI response for ${normalizedUrl} was not an array or a single prospect object after parsing:`,
                  parsedResponse
                );
                parsedResponse = [];
              }
            }

            parsedResponse.forEach((p: any) => {
              if (
                p &&
                p.name &&
                typeof p.name === "string" &&
                p.prospectType &&
                Object.values(PrismaProspectType).includes(
                  p.prospectType as PrismaProspectType
                )
              ) {
                structuredProspects.push({
                  ...p,
                  email: p.email || null,
                  phone: p.phone || null,
                  address: p.address || null,
                  website: p.website || null,
                  specialization: p.specialization || null,
                  sourceUrl: normalizedUrl,
                  id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                });
              } else {
                console.warn(
                  "Skipping invalid prospect structure from OpenAI or mismatched prospectType:",
                  p
                );
              }
            });
          } catch (parseError) {
            console.error(
              `Error parsing CLEANED OpenAI JSON response for ${normalizedUrl}:`,
              parseError,
              "\nCleaned String was:",
              cleanedJsonString
            );
          }
        } else {
          console.warn(`OpenAI returned empty content for ${normalizedUrl}`);
        }
      } catch (openaiError: any) {
        console.error(
          `OpenAI API call failed for ${normalizedUrl}:`,
          openaiError.message || openaiError
        );
      }
    }

    logAudit({
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: AuditActionType.PROSPECT_DISCOVERY_SEARCH,
      entityType: AuditEntityType.SYSTEM,
      details: { query: fullQuery, resultsCount: structuredProspects.length },
      ipAddress,
      userAgent,
    });
    return NextResponse.json({ results: structuredProspects });
  } catch (error) {
    console.error(
      "Error in prospect discovery search (outer try-catch):",
      error
    );
    logAudit({
      userId: userIdForAudit,
      action: AuditActionType.FAILED,
      entityType: AuditEntityType.SYSTEM,
      details: {
        error: error instanceof Error ? error.message : String(error),
        operation: "PROSPECT_DISCOVERY_FAILED_OUTER",
      },
      ipAddress,
      userAgent,
    });
    return NextResponse.json(
      { error: "Internal server error during prospect discovery." },
      { status: 500 }
    );
  }
}
