from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn
from backend.core import run_llm
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="LangChain Documentation Helper",
    description="A RAG-based chatbot for LangChain documentation.",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


class ChatRequest(BaseModel):
    query: str

@app.post("/chat")
async def chat(chat_request: ChatRequest):
    """
    Endpoint to handle chat requests.
    It takes a user query, passes it to the RAG pipeline,
    and returns the answer and context.
    """
    result = run_llm(query=chat_request.query)

    # Ensure the context is serializable
    serializable_context = []
    if "context" in result and result["context"]:
        for doc in result["context"]:
            # Handle LangChain Document objects
            if hasattr(doc, 'page_content') and hasattr(doc, 'metadata'):
                serializable_context.append({
                    "id": getattr(doc, 'id', None),
                    "page_content": doc.page_content,
                    "metadata": doc.metadata,
                })
            # Handle dictionary representations of documents
            elif isinstance(doc, dict):
                serializable_context.append(doc)

    response_data = {
        "answer": result["answer"],
        "context": serializable_context,
    }
    return response_data

# This mounts the 'frontend' directory at the root.
# Make sure it's defined after all other API routes.
app.mount("/", StaticFiles(directory="frontend", html = True), name="static")

if __name__ == "__main__":
    print("Starting FastAPI server...")
    print("Access the UI at http://127.0.0.1:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000)
