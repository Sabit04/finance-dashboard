import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { CATEGORIES, type Category } from "@/lib/types";

export const runtime = "nodejs";

interface CategorizeRequestItem {
  id: string;
  description: string;
  amount: number;
}

const categorizeTool: Anthropic.Tool = {
  name: "categorize_transactions",
  description: "Assign one category to each transaction.",
  input_schema: {
    type: "object",
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            category: { type: "string", enum: [...CATEGORIES] },
          },
          required: ["id", "category"],
        },
      },
    },
    required: ["results"],
  },
};

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing ANTHROPIC_API_KEY." },
      { status: 500 },
    );
  }

  const body = await request.json();
  const items: CategorizeRequestItem[] = body?.transactions ?? [];

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "No transactions provided." }, { status: 400 });
  }

  const MAX_TRANSACTIONS_PER_REQUEST = 500;
  if (items.length > MAX_TRANSACTIONS_PER_REQUEST) {
    return NextResponse.json(
      { error: `Too many transactions in one file (max ${MAX_TRANSACTIONS_PER_REQUEST}).` },
      { status: 413 },
    );
  }

  const client = new Anthropic({ apiKey });

  const transactionList = items
    .map((item) => `${item.id} | ${item.description} | ${item.amount.toFixed(2)}`)
    .join("\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    tools: [categorizeTool],
    tool_choice: { type: "tool", name: "categorize_transactions" },
    messages: [
      {
        role: "user",
        content: `Categorize each bank transaction below into exactly one of these categories: ${CATEGORIES.join(", ")}.

Format of each line is "id | description | amount". A positive amount is money in (likely Income), a negative amount is money out.
Guidance: gas stations, rideshare, parking and transit are Transportation; groceries, restaurants and coffee are Food & Dining; pharmacies, gyms and medical copays are Health & Fitness; streaming services are Entertainment. Use Other only when nothing fits.

${transactionList}`,
      },
    ],
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );

  if (!toolUse) {
    return NextResponse.json({ error: "Model did not return categorization." }, { status: 502 });
  }

  const results = (toolUse.input as { results: { id: string; category: Category }[] }).results;
  const categoryById = new Map(results.map((result) => [result.id.trim(), result.category]));

  const categorized = items.map((item) => ({
    id: item.id,
    category: categoryById.get(item.id) ?? "Other",
  }));

  return NextResponse.json({ categorized });
}
