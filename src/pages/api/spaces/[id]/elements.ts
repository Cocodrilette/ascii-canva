import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// Note: Use service role key for API since we are doing manual auth via API Keys
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id: spaceId } = req.query;

  const apiKey = req.headers["x-api-key"] as string;

  if (!apiKey) {
    return res.status(401).json({ error: "API Key required" });
  }

  try {
    // 1. Validate API Key and get User ID
    const { data: keyData, error: keyError } = await supabase
      .from("api_keys")
      .select("user_id, status")
      .eq("key", apiKey)
      .single();

    if (keyError || !keyData) {
      return res.status(401).json({ error: "Invalid API Key" });
    }

    if (keyData.status !== "active") {
      return res.status(403).json({ error: "API Key revoked" });
    }

    console.log("API Key valid for user:", keyData.user_id);


    // 2. Resolve Space
    // First, try to find by ID (UUID) or by Slug
    const { data: spaceData, error: spaceError } = await supabase
      .from("spaces")
      .select("id, owner_id").eq("id", spaceId)
      .maybeSingle();

    if (spaceError || !spaceData) {
      console.log("Space lookup failed for ID/Slug:", spaceId, spaceError);
      return res.status(404).json({ error: "Space not found" });
    }

    // 3. Authorization
    if (spaceData.owner_id !== keyData.user_id) {
      return res.status(403).json({ error: "Not authorized to modify this space" });
    }

    // 4. Extract Element Data
    const { type, x, y, params } = req.body;

    if (!type || x === undefined || y === undefined) {
      return res.status(400).json({ error: "Missing required fields: type, x, y" });
    }

    // 5. Create Element
    const { data: elementData, error: elementError } = await supabase
      .from("elements")
      .insert({
        space_id: spaceData.id,
        created_by: keyData.user_id,
        type,
        x,
        y,
        params: params || {},
      })
      .select()
      .single();

    if (elementError) {
      return res.status(500).json({ error: `Internal error: ${elementError.message}` });
    }

    return res.status(201).json({
      success: true,
      element: elementData
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
