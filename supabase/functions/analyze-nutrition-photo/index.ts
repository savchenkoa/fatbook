import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "jsr:@openai/openai";

const client = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"), // This is the default and can be omitted
});

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // This is needed if the function is to be invoked from a browser
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { image } = await req.json();

  const prompt = `
  Analyze this nutrition label image and extract nutritional information per 100g:
  
  EXTRACT:
  - Calories/Kalorien/Калории (kcal per 100g)
  - Protein/Eiweiß/Белки (g per 100g)
  - Fat/Fett/Жиры (g per 100g)
  - Carbohydrates/Kohlenhydrate/Углеводы (g per 100g)
  
  IMPORTANT:
  - Convert all values to "per 100g" if they're given per serving
  - Return only numbers, no units
  - If a value is not found, use 0
  
  LANGUAGES TO SUPPORT:
  - English (calories, protein, fat, carbohydrates)
  - German (Kalorien, Eiweiß, Fett, Kohlenhydrate)  
  - Russian (калории, белки, жиры, углеводы)

  Return ONLY strictly JSON format:
  {"calories": number, "proteins": number, "fats": number, "carbs": number}
  `;

  try {
    const response = await client.responses.create({
      // model: "gpt-4.1",
      model: "gpt-4.1-mini",
      instructions: "Return a valid JSON only",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: image },
          ],
        },
      ],
    });

    let result;
    try {
      result = JSON.parse(response.output_text);
    } catch (error) {
      console.error(
        "Error parsing JSON response:",
        error,
        "Actual response:",
        response.output_text,
      );
      console.log("Trying to clean model output...");
      result = response.output_text
        .replace("```json", "")
        .replace("```", "")
        .trim();
      console.log("Clean result:", result);
    }

    return new Response(result, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error analyzing nutrition photo:", error);
    return new Response(
      JSON.stringify({ error: error.message ?? "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
