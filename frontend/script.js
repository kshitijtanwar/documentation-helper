document.addEventListener("DOMContentLoaded", () => {

    const chatBox = document.getElementById("chat-box");
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");
    const newChatBtn = document.getElementById("new-chat");

    const API_URL = "http://127.0.0.1:8000/chat";


    /* =========================
       MARKED CONFIG
    ========================= */

    marked.setOptions({
        breaks: true,
        gfm: true
    });


    /* =========================
       HELPERS
    ========================= */

    function scrollToBottom() {
        requestAnimationFrame(() => {
            chatBox.scrollTo({
                top: chatBox.scrollHeight,
                behavior: "smooth"
            });
        });
    }


    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }


    /* =========================
       CODE BLOCKS
    ========================= */

    function formatCodeBlocks(container) {

        const codeBlocks = container.querySelectorAll("pre");

        codeBlocks.forEach((pre) => {

            const code = pre.querySelector("code");

            if (!code) return;

            const wrapper = document.createElement("div");
            wrapper.className = "code-wrapper";

            const header = document.createElement("div");
            header.className = "code-header";

            let language = "Code";

            const classes = code.className.split(" ");

            const languageClass = classes.find((item) =>
                item.startsWith("language-")
            );

            if (languageClass) {
                language = languageClass
                    .replace("language-", "")
                    .toUpperCase();
            }

            header.innerHTML = `
                <span>${escapeHtml(language)}</span>
                <button class="copy-code">Copy</button>
            `;

            pre.parentNode.insertBefore(wrapper, pre);

            wrapper.appendChild(header);
            wrapper.appendChild(pre);

            const copyButton = header.querySelector(".copy-code");

            copyButton.addEventListener("click", async () => {

                try {

                    await navigator.clipboard.writeText(
                        code.textContent
                    );

                    copyButton.textContent = "Copied";

                    setTimeout(() => {
                        copyButton.textContent = "Copy";
                    }, 1500);

                } catch (error) {

                    console.error(
                        "Unable to copy code:",
                        error
                    );

                }

            });

        });

    }


    /* =========================
       SOURCES
    ========================= */

    function extractSources(text) {

        const sources = [];

        const sourceRegex =
            /\[Source\]\((.*?)\)/g;

        let match;

        while ((match = sourceRegex.exec(text)) !== null) {

            if (match[1]) {
                sources.push(match[1]);
            }

        }

        return [...new Set(sources)];
    }


    function removeSources(text) {

        return text.replace(
            /\[Source\]\((.*?)\)/g,
            ""
        );
    }


    function createSources(sources) {

        if (!sources.length) {
            return null;
        }

        const container =
            document.createElement("div");

        container.className = "sources";

        const label =
            document.createElement("div");

        label.className = "sources-label";

        label.textContent = "Sources";

        container.appendChild(label);


        sources.forEach((source, index) => {

            const link =
                document.createElement("a");

            link.className = "source-bubble";

            link.href = source;

            link.target = "_blank";

            link.rel = "noopener noreferrer";

            link.innerHTML = `
                <span class="source-icon">
                    ${index + 1}
                </span>

                <span>
                    Documentation ${index + 1}
                </span>
            `;

            container.appendChild(link);

        });


        return container;
    }


    /* =========================
       ADD USER MESSAGE
    ========================= */

    function addUserMessage(text) {

        const message =
            document.createElement("div");

        message.className =
            "message user";

        const content =
            document.createElement("div");

        content.className =
            "message-content";

        content.textContent = text;

        message.appendChild(content);

        chatBox.appendChild(message);

        scrollToBottom();
    }


    /* =========================
       ADD AI MESSAGE
    ========================= */

    function addAIMessage(text) {

        const message =
            document.createElement("div");

        message.className =
            "message ai";


        /* AI icon */

        const avatar =
            document.createElement("div");

        avatar.className =
            "ai-avatar";

        avatar.textContent = "✦";


        /* Content */

        const content =
            document.createElement("div");

        content.className =
            "message-content";


        /* Extract sources */

        const sources =
            extractSources(text);

        const cleanText =
            removeSources(text);


        /* Markdown */

        content.innerHTML =
            marked.parse(cleanText);


        /* Code formatting */

        formatCodeBlocks(content);


        /* Sources */

        const sourcesElement =
            createSources(sources);

        if (sourcesElement) {
            content.appendChild(sourcesElement);
        }


        message.appendChild(avatar);

        message.appendChild(content);

        chatBox.appendChild(message);

        scrollToBottom();
    }


    /* =========================
       LOADING
    ========================= */

    function showLoading() {

        const loading =
            document.createElement("div");

        loading.className =
            "loading-message";

        loading.id =
            "loading-message";


        loading.innerHTML = `
            <div class="ai-avatar">✦</div>

            <div class="loading-content">

                <div class="thinking">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>

            </div>
        `;


        chatBox.appendChild(loading);

        scrollToBottom();
    }


    function hideLoading() {

        const loading =
            document.getElementById(
                "loading-message"
            );

        if (loading) {
            loading.remove();
        }

    }


    /* =========================
       SEND MESSAGE
    ========================= */

    async function sendMessage() {

        const query =
            userInput.value.trim();

        if (!query) return;


        /* Remove welcome */

        const welcome =
            document.getElementById("welcome");

        if (welcome) {
            welcome.remove();
        }


        /* User message */

        addUserMessage(query);


        /* Reset input */

        userInput.value = "";

        autoResize();


        /* Disable input */

        userInput.disabled = true;

        sendBtn.disabled = true;


        /* Loading */

        showLoading();


        try {

            const response =
                await fetch(API_URL, {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        query: query
                    })

                });


            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );

            }


            const data =
                await response.json();


            hideLoading();


            if (
                data.answer &&
                data.answer.length > 0
            ) {

                const answer =
                    data.answer[0].text;

                addAIMessage(answer);

            } else {

                addAIMessage(
                    "I couldn't find an answer to that."
                );

            }


        } catch (error) {

            console.error(
                "Chat error:",
                error
            );

            hideLoading();


            addAIMessage(
                "I couldn't connect to the documentation service. Please check that the backend is running and try again."
            );

        } finally {

            userInput.disabled = false;

            sendBtn.disabled = false;

            userInput.focus();

        }

    }


    /* =========================
       AUTO RESIZE
    ========================= */

    function autoResize() {

        userInput.style.height = "auto";

        userInput.style.height =
            Math.min(
                userInput.scrollHeight,
                180
            ) + "px";

    }


    /* =========================
       EVENTS
    ========================= */

    sendBtn.addEventListener(
        "click",
        sendMessage
    );


    userInput.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );


    userInput.addEventListener(
        "input",
        autoResize
    );


    /* =========================
       SUGGESTIONS
    ========================= */

    document.addEventListener(
        "click",
        (event) => {

            const suggestion =
                event.target.closest(
                    ".suggestion"
                );

            if (!suggestion) return;

            userInput.value =
                suggestion.textContent.trim();

            autoResize();

            userInput.focus();

        }
    );


    /* =========================
       NEW CHAT
    ========================= */

    newChatBtn.addEventListener(
        "click",
        () => {

            chatBox.innerHTML = `
                <section class="welcome" id="welcome">

                    <div class="welcome-icon">
                        ✦
                    </div>

                    <h1>
                        How can I help with LangChain?
                    </h1>

                    <p>
                        Ask questions about LangChain concepts,
                        APIs, integrations, agents, RAG,
                        or implementation details.
                    </p>

                    <div class="suggestions">

                        <button class="suggestion">
                            How do LangChain agents work?
                        </button>

                        <button class="suggestion">
                            Explain RAG in LangChain
                        </button>

                        <button class="suggestion">
                            How do I create a custom tool?
                        </button>

                    </div>

                </section>
            `;

            userInput.value = "";

            autoResize();

            userInput.focus();

        }
    );

});