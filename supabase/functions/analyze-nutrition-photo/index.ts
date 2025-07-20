import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "jsr:@openai/openai";

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const NutritionInfoSchema = {
  name: "nutrition_info_nullable",
  schema: {
    type: "object",
    properties: {
      nutritionInfo: {
        anyOf: [
          {
            type: "null",
            description:
              "Response can be null to indicate missing or unavailable data.",
          },
          {
            $ref: "#/$defs/nutrition_info",
          },
        ],
        description: "A response with nutrition facts or null",
      },
    },
    required: ["nutritionInfo"],
    additionalProperties: false,
    $defs: {
      nutrition_info: {
        type: "object",
        properties: {
          calories: {
            type: "number",
            description: "Amount of calories; must be present",
          },
          fats: {
            type: "number",
            description: "Amount of fats in grams; must be present,
          },
          proteins: {
            type: "number",
            description: "Amount of proteins in grams; must be present"
          },
          carbs: {
            type: "number",
            description: "Amount of carbohydrates in grams; must be present"
          },
        },
        required: ["calories", "fats", "proteins", "carbs"],
        additionalProperties: false
      },
    },
  },
  strict: true
};

Deno.serve(async (req) => {
  // This is needed if the function is to be invoked from a browser
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { image } = await req.json();

  const instructions = `
  # Identity
  
  You are a nutrition labels analyzer that reads a photo of nutrition label on product package and returns nutritional information as a JSON. 
  You extract from image: calories, proteins, fats and carbohydrates per 100g. You understand English, German and Russian languages.
  
  # Instructions
  
  * Only output a valid JSON in your response with no additional formatting or commentary.
  * When there is no nutritional information in the image, return 0 for all values.
  * When the information is not in English, German or Russian, still try to read and understand it.
    
  # Examples
  
  <product_review id="example-1">
    <image alt="An image with clearly readable nutritional information: calores: 100, proteins: 10.5, fats: 20.2, carbohydrates: 30"></image>
  </product_review>
  
  <assistant_response id="example-1">
  { "calories": 100, "proteins": 10.5, "fats": 20.2, "carbs": 30 }
  </assistant_response>
  
  <product_review id="example-2">
    <image alt="An image without nutritional information"></image>
  </product_review>
  
  <assistant_response id="example-2">
  { "calories": 0, "proteins": 0, "fats": 0, "carbs": 0 }
  </assistant_response>
  `;

  try {
    const response = await openai.responses.parse({
      model: "gpt-4.1-mini",
      instructions: instructions,
      input: [
        {
          role: "user",
          content: [{ type: "input_image", image_url: image }]
        },
      ],
      text: {
        format: {
          type: "json_schema",
          ...NutritionInfoSchema
        },
      },
    });

    if (
      response.status === "incomplete" &&
      response.incomplete_details.reason === "max_output_tokens"
    ) {
      throw new Error("Incomplete response / max_output_tokens");
    }

    const nutrition_response = response.output[0].content[0];

    if (nutrition_response.type === "refusal") {
      console.log(nutrition_response.refusal);
    } else if (nutrition_response.type === "output_text") {
      return new Response(JSON.stringify(response.output_parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    } else {
      throw new Error("No response content");
    }
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
