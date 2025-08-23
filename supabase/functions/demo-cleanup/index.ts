import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: demoUser } = await supabaseClient.auth.admin.getUserById(
      Deno.env.get("DEMO_USER_ID"),
    );

    if (!demoUser.user) {
      return new Response("Demo user not found", {
        status: 404,
        headers: corsHeaders,
      });
    }

    const demoUserId = demoUser.user.id;

    await supabaseClient.from("eatings").delete().eq("userId", demoUserId);

    const { data: userMetadata } = await supabaseClient
      .from("user_metadata")
      .select()
      .eq("id", demoUserId)
      .maybeSingle();
    await supabaseClient
      .from("dishes")
      .update({ deleted: true })
      .eq("collectionId", userMetadata.collectionId)
      .throwOnError();

    return new Response(
      JSON.stringify({ message: "Demo data cleaned successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
