// ============================================
// اوای یقین - Cloudflare Worker Proxy
// مسجد حضرت ابوالفضل (ع)
// ============================================

export default {
  async fetch(request, env) {

    // CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }


    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Only POST requests are allowed"
        }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }


    try {

      const data = await request.json();


      const apiUrl =
        data.apiUrl ||
        "https://api.groq.com/openai/v1/chat/completions";


      const requestBody =
        data.requestBody;


      if (!requestBody) {
        return new Response(
          JSON.stringify({
            error: "Request body missing"
          }),
          {
            status:400,
            headers:{
              "Content-Type":"application/json",
              "Access-Control-Allow-Origin":"*"
            }
          }
        );
      }



      // گرفتن کلید از Cloudflare Variables
      const apiKey = env.GROQ_API_KEY;


      if (!apiKey) {

        return new Response(
          JSON.stringify({
            error:"GROQ_API_KEY not configured"
          }),
          {
            status:500,
            headers:{
              "Content-Type":"application/json",
              "Access-Control-Allow-Origin":"*"
            }
          }
        );

      }



      const response = await fetch(
        apiUrl,
        {
          method:"POST",

          headers:{
            "Content-Type":"application/json",
            "Authorization":
              "Bearer " + apiKey
          },

          body:
            JSON.stringify(requestBody)
        }
      );



      const result =
        await response.text();



      return new Response(
        result,
        {
          status:response.status,

          headers:{
            "Content-Type":"application/json",
            "Access-Control-Allow-Origin":"*"
          }
        }
      );



    } catch(error){


      return new Response(

        JSON.stringify({
          error:error.message
        }),

        {
          status:500,

          headers:{
            "Content-Type":"application/json",
            "Access-Control-Allow-Origin":"*"
          }
        }

      );

    }

  }
};
