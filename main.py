from langchain_pinecone import PineconeVectorStore
import os
from dotenv import load_dotenv
from langchain_community.embeddings import HuggingFaceEmbeddings

load_dotenv()

model_name = "all-MiniLM-L6-v2"

embeddings = HuggingFaceEmbeddings(
    model_name=model_name,
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": False},
)


def main():
    vectorstore = PineconeVectorStore(
        index_name=os.environ.get("INDEX_NAME"),
        embedding=embeddings,
    )

    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

    chunks = retriever.invoke("What is this documentation about?")

    print(f"Retrieved {len(chunks)} chunks from the vector store.")

    for i, chunk in enumerate(chunks):
        print(f"\n--- Chunk {i + 1} ---")
        print(chunk.page_content)


if __name__ == "__main__":
    main()
