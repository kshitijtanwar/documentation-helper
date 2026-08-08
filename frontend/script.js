document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const aiAvatar = 'images/ai_avatar.png';
    const userAvatar = 'images/user_avatar.png';

    // Function to add a message to the chat box
    const addMessage = (message, sender) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);

        const avatar = document.createElement('img');
        avatar.src = sender === 'user' ? userAvatar : aiAvatar;
        avatar.alt = `${sender} avatar`;
        avatar.classList.add('avatar');

        const textContent = document.createElement('div');
        textContent.classList.add('text-content');

        if (sender === 'ai') {
            const rawHtml = marked.parse(message.text);
            textContent.innerHTML = rawHtml;

            // Extract and display sources
            const sourceRegex = /\[Source\]\((.*?)\)/g;
            let sourceMatch;
            const sources = [];
            while ((sourceMatch = sourceRegex.exec(message.text)) !== null) {
                sources.push(sourceMatch[1]);
            }
             textContent.innerHTML = textContent.innerHTML.replace(/\[Source\]\((.*?)\)/g, '');


            if (sources.length > 0) {
                const sourcesContainer = document.createElement('div');
                sourcesContainer.classList.add('sources-container');
                const uniqueSources = [...new Set(sources)];

                uniqueSources.forEach((source, index) => {
                    const sourceBubble = document.createElement('a');
                    sourceBubble.href = source;
                    sourceBubble.target = '_blank';
                    sourceBubble.classList.add('source-bubble');
                    sourceBubble.textContent = `Source ${index + 1}`;
                    sourcesContainer.appendChild(sourceBubble);
                });
                textContent.appendChild(sourcesContainer);
            }

        } else {
            textContent.textContent = message;
        }

        messageElement.appendChild(avatar);
        messageElement.appendChild(textContent);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const showLoadingIndicator = () => {
        const loadingElement = document.createElement('div');
        loadingElement.classList.add('message', 'ai-message');
        loadingElement.id = 'loading-indicator';

        const avatar = document.createElement('img');
        avatar.src = aiAvatar;
        avatar.alt = 'AI avatar';
        avatar.classList.add('avatar');

        const textContent = document.createElement('div');
        textContent.classList.add('text-content');

        const loadingIndicator = document.createElement('div');
        loadingIndicator.classList.add('loading-indicator');
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            loadingIndicator.appendChild(dot);
        }
        textContent.appendChild(loadingIndicator);

        loadingElement.appendChild(avatar);
        loadingElement.appendChild(textContent);
        chatBox.appendChild(loadingElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const hideLoadingIndicator = () => {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    };

    const sendMessage = async () => {
        const query = userInput.value.trim();
        if (!query) return;

        addMessage(query, 'user');
        userInput.value = '';
        userInput.style.height = 'auto';

        showLoadingIndicator();

        try {
            const response = await fetch('http://127.0.0.1:8000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: query }),
            });

            hideLoadingIndicator();

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.answer && data.answer.length > 0) {
                 const aiResponse = {
                    text: data.answer[0].text
                };
                addMessage(aiResponse, 'ai');
            } else {
                 addMessage({text: "I couldn't find an answer to that."}, 'ai');
            }

        } catch (error) {
            hideLoadingIndicator();
            console.error('Error fetching data:', error);
            addMessage({text: 'Sorry, something went wrong. Please try again.'}, 'ai');
        }
    };

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = `${userInput.scrollHeight}px`;
    });
});
