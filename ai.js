// ==========================
// Eyad Nintendo Ali AI
// ai.js
// ==========================

const WORKER_URL = "https://eyadnintendoaliai.eyad-aboelazm2311.workers.dev";


async function sendMessage() {

    const input = document.getElementById("userInput");
    const chat = document.getElementById("chat");
    const provider = document.getElementById("provider").value;

    const message = input.value.trim();

    if (message === "") return;


    chat.innerHTML += `
        <div class="user">
            <b>You:</b> ${message}
        </div>
    `;


    input.value = "";


    chat.innerHTML += `
        <div class="ai" id="loading">
            🤖 Thinking...
        </div>
    `;


    chat.scrollTop = chat.scrollHeight;


    try {

        const response = await fetch(WORKER_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                provider: provider,

                message: message

            })

        });


        const data = await response.json();


        document.getElementById("loading").remove();


        chat.innerHTML += `

            <div class="ai">

                <b>${provider.toUpperCase()}:</b><br>

                ${data.reply || data.error}

            </div>

        `;


    } catch (error) {


        const loading = document.getElementById("loading");

        if (loading) loading.remove();


        chat.innerHTML += `

            <div class="ai">

                ❌ Error connecting to AI.

            </div>

        `;


        console.error(error);

    }


    chat.scrollTop = chat.scrollHeight;

}



document.addEventListener("DOMContentLoaded", () => {


    const input = document.getElementById("userInput");


    input.addEventListener("keydown", (e) => {


        if (e.key === "Enter") {

            sendMessage();

        }


    });


});
