from importlib import metadata
import os
import ssl
from typing import Any, Dict, List
import asyncio

import certifi
from dotenv import load_dotenv

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_tavily import TavilyCrawl, TavilyExtract, TavilyMap
from sympy import limit
from logger import Colors, log_info, log_success, log_error, log_warning, log_header

load_dotenv()


ssl__context = ssl.create_default_context(cafile=certifi.where())
os.environ["SSL_CERT_FILE"] = certifi.where()
os.environ["REQUESTS_CA_BUNDLE"] = certifi.where()


# Model: all-MiniLM-L6-v2, Dimension: 384
model_name = "all-MiniLM-L6-v2"
model_kwargs = {"device": "cpu"}
encode_kwargs = {"normalize_embeddings": False}

embeddings = HuggingFaceEmbeddings(
    model_name=model_name, model_kwargs=model_kwargs, encode_kwargs=encode_kwargs
)

vectorstore = PineconeVectorStore(
    index_name=os.environ.get("INDEX_NAME"), embedding=embeddings
)

tavily_crawl = TavilyCrawl(max_depth=5, max_pages=1000, max_breadth=20, limit=2000)
tavily_extract = TavilyExtract()
tavily_map = TavilyMap(max_depth=5, max_pages=1000, max_breadth=20)


async def index_documents(chunks: List[Document]):
    """Index documents into the vector store."""
    log_header("Indexing Documents into Vector Store")
    log_info(f"Vector Store: Indexing {len(chunks)} chunks into the vector store")

    try:
        vectorstore.add_documents(chunks)
        log_success(f"Successfully indexed {len(chunks)} chunks into the vector store")
    except Exception as e:
        log_error(f"Error indexing documents: {e}")


async def main():
    """Main Async function to orchestrate the entire process."""
    log_header("Documentation Ingestion Pipeline")
    log_info(
        "TavilyCrawl: Starting the crawl process documentation from LangChain Docs",
        color=Colors.PURPLE,
    )

    res = tavily_crawl.invoke(
        {
            "url": "https://docs.langchain.com/oss/python/langchain/agents",
            # "instructions": "content on ai agents",
        }
    )

    all_docs = [
        Document(
            page_content=result["raw_content"] or "No content found",
            metadata={"source": result["url"]},
        ) for result in res["results"]
    ]
    log_success(f"Total documents extracted: {len(all_docs)}")

    log_header("Splitting Documents into Chunks")
    log_info(
        "Text Splitter: Splitting documents into chunks of 4000 characters with 200 characters overlap"
    )

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=4000, chunk_overlap=200)
    chunks = text_splitter.split_documents(all_docs)
    log_success(f"Total chunks created: {len(chunks)}")

    await index_documents(chunks)


if __name__ == "__main__":
    asyncio.run(main())
