// ==========================
// Eyad Nintendo Ali AI
// ai.js
// ==========================

// Replace this with your Cloudflare Worker URL
const WORKER_URL = "https://YOUR-WORKER.workers.dev";

async function sendMessage() {

    const input = document.getElementById("userInput");
    const chat = document.getElementById("chat");
    const provider = document.getElementById("provider").value;

    const message = input.value.trim();

    if(message === "") return;

    chat.innerHTML += `
        <div class="user">
            <b>You:</b> ${message}
        </div>
    `;

    input.value="";

    chat.innerHTML += `
        <div class="ai" id="loading">
            🤖 Thinking...
        </div>
    `;

    chat.scrollTop = chat.scrollHeight;

    try{

        const response = await fetch(WORKER_URL,{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                provider:provider,
                message:message
            })
        });

        const data = await response.json();

        document.getElementById("loading").remove();

        chat.innerHTML += `
            <div class="ai">
                <b>${provider.toUpperCase()}:</b><br>
                ${data.reply}
            </div>
        `;

    }
    catch(e){

        document.getElementById("loading").remove();

        chat.innerHTML += `
            <div class="ai">
                ❌ Error connecting to AI.
            </div>
        `;

    }

    chat.scrollTop = chat.scrollHeight;

}

document.addEventListener("DOMContentLoaded",()=>{

    const input=document.getElementById("userInput");

    input.addEventListener("keydown",function(e){

        if(e.key==="Enter"){

            sendMessage();

        }

    });

});
