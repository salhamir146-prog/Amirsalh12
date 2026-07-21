// ============================================
// اوای یقین - Cloudflare Worker
// AI Proxy + Users + Chat Storage
// ============================================

export default {
  async fetch(request, env) {

    // CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders()
      });
    }


    const url = new URL(request.url);


    // =========================
    // ثبت کاربر
    // =========================
    if (url.pathname === "/api/register" && request.method === "POST") {

      const data = await request.json();

      const name = data.name;
      const phone = data.phone;


      if (!name || !phone) {
        return json({
          error: "نام و شماره الزامی است"
        });
      }


      await env.DB.prepare(
        `
        INSERT INTO users
        (name, phone, created_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(phone)
        DO UPDATE SET name=excluded.name
        `
      )
      .bind(name, phone)
      .run();



      return json({
        success:true,
        message:"کاربر ثبت شد"
      });

    }




    // =========================
    // ذخیره پیام
    // =========================
    if (url.pathname === "/api/save-chat" && request.method === "POST") {


      const data = await request.json();


      await env.DB.prepare(
        `
        INSERT INTO chats
        (phone,user_message,bot_message,created_at)
        VALUES (?,?,?,datetime('now'))
        `
      )
      .bind(
        data.phone,
        data.user,
        data.bot
      )
      .run();



      return json({
        success:true
      });

    }




    // =========================
    // دریافت تاریخچه کاربر
    // =========================
    if(url.pathname === "/api/history") {


      const phone =
      url.searchParams.get("phone");



      const result =
      await env.DB.prepare(
        `
        SELECT *
        FROM chats
        WHERE phone=?
        ORDER BY id DESC
        `
      )
      .bind(phone)
      .all();



      return json(result.results);

    }




    // =========================
    // هوش مصنوعی Groq
    // =========================
    if(url.pathname === "/api/chat"
    && request.method==="POST"){


      const data =
      await request.json();



      const response =
      await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method:"POST",

          headers:{
            "Content-Type":"application/json",
            "Authorization":
            "Bearer "+env.GROQ_API_KEY
          },


          body:JSON.stringify({

            model:
            "llama-3.3-70b-versatile",


            messages:
            data.messages,


            temperature:0.7,


            max_tokens:2048

          })

        });



      const result =
      await response.json();



      return json(result);

    }




    return json({
      status:"Oay Yaqin Worker Running"
    });


  }
};





// =========================
// توابع کمکی
// =========================


function json(data){

return new Response(
JSON.stringify(data),
{
headers:{
"Content-Type":"application/json",
...corsHeaders()
}
});

}



function corsHeaders(){

return {

"Access-Control-Allow-Origin":"*",

"Access-Control-Allow-Headers":
"Content-Type",

"Access-Control-Allow-Methods":
"GET,POST,OPTIONS"

};

}
