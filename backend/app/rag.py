import os
import json
import base64
import random
from io import BytesIO
from gtts import gTTS
from dotenv import load_dotenv
import google.generativeai as genai
from backend.app.drug_data import DRUG_DATABASE

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

# Configure Gemini
api_key = os.environ.get("GEMINI_API_KEY")
gemini_available = False
if api_key:
    try:
        genai.configure(api_key=api_key)
        _ = genai.GenerativeModel('gemini-flash-latest')
        gemini_available = True
        print("Google Gemini API is configured and active for chat!")
    except Exception as e:
        print(f"Warning: Failed to configure Google Gemini API ({e}). Falling back to local RAG.")
else:
    print("Warning: GEMINI_API_KEY not found in environment or .env. Falling back to local RAG.")


# Try to load ChromaDB and SentenceTransformers.
# If they fail to load (e.g. library installation in progress or missing C++ compilers),
# we fall back to a python-based TF-IDF/Keyword vector database, ensuring zero runtime crashes.
db_client = None
collection = None
embedding_model = None

try:
    low_mem = os.getenv("LOW_MEMORY_MODE", "1").lower() in ("1", "true") or os.getenv("RENDER") == "true"
    if not low_mem:
        import chromadb
        from chromadb.config import Settings
        from sentence_transformers import SentenceTransformer
        
        # 1. Initialize sentence transformer
        print("Loading SentenceTransformer model 'all-MiniLM-L6-v2'...")
        embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        
        # 2. Initialize ChromaDB
        chroma_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "chroma_db")
        os.makedirs(chroma_dir, exist_ok=True)
        
        db_client = chromadb.PersistentClient(path=chroma_dir)
        
        # Create or get collection
        collection = db_client.get_or_create_collection("drug_monographs")
        
        # Check if collection is empty, then seed it
        if collection.count() == 0:
            print("Seeding ChromaDB with drug monographs...")
            documents = []
            metadatas = []
            ids = []
            embeddings = []
            
            for drug_name, details in DRUG_DATABASE.items():
                # Construct a comprehensive document string for embedding
                doc_text = f"Drug: {drug_name.capitalize()}\n"
                doc_text += f"Category: {details['category']}\n"
                doc_text += f"Purpose: {details['purpose']}\n"
                doc_text += f"Common Side Effects: {', '.join(details['side_effects']['common'])}\n"
                doc_text += f"Serious Warning Symptoms: {', '.join(details['side_effects']['serious'])}\n"
                doc_text += f"Alcohol Interaction: {details['alcohol_interaction']['effects']}\n"
                doc_text += f"Food Interaction: {', '.join(details['food_interactions'])}\n"
                doc_text += f"Precautions: {', '.join(details['precautions'])}"
                
                documents.append(doc_text)
                metadatas.append({"drug": drug_name})
                ids.append(drug_name)
                
                # Generate embedding
                emb = embedding_model.encode(doc_text).tolist()
                embeddings.append(emb)
                
            collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids,
                embeddings=embeddings
            )
            print(f"Seeded {len(ids)} drug monographs into ChromaDB.")
        else:
            print(f"ChromaDB already initialized with {collection.count()} items.")
    else:
        print("Low Memory / Cloud Mode: Skipping heavy SentenceTransformers/ChromaDB to stay within RAM limits (<512MB). Using fast semantic dictionary matching.")
        
except Exception as e:
    print(f"Warning: RAG stack initialization skipped/failed ({e}). Utilizing Python dictionary-based semantic search fallback.")


def fallback_search(query: str, limit: int = 2) -> list:
    """Fallback search using simple keyword intersection matching."""
    query_words = set(query.lower().split())
    scored_drugs = []
    
    for drug_name, details in DRUG_DATABASE.items():
        score = 0
        # Check matching of name
        if drug_name in query.lower():
            score += 10
            
        # Match other terms
        drug_terms = (
            details["purpose"] + " " + 
            details["category"] + " " + 
            " ".join(details["active_ingredients"]) + " " +
            " ".join(details["side_effects"]["common"]) + " " +
            " ".join(details["side_effects"]["serious"])
        ).lower()
        
        for word in query_words:
            if len(word) > 3 and word in drug_terms:
                score += 1
                
        if score > 0:
            scored_drugs.append((score, drug_name))
            
    scored_drugs.sort(reverse=True, key=lambda x: x[0])
    return [drug for _, drug in scored_drugs[:limit]]


def retrieve_drug_monographs(query: str, limit: int = 2) -> list[dict]:
    """Retrieves relevant drug records from ChromaDB or fallback database."""
    matched_drugs = []
    
    # 1. Try vector database retrieval
    if collection is not None and embedding_model is not None:
        try:
            query_vector = embedding_model.encode(query).tolist()
            results = collection.query(
                query_embeddings=[query_vector],
                n_results=limit
            )
            # results['ids'] is a list of lists
            if results and 'ids' in results and results['ids']:
                matched_drugs = results['ids'][0]
        except Exception as e:
            print(f"ChromaDB query failed: {e}. Falling back to keyword search.")
            
    # 2. Heuristic search if vector database search returned nothing or failed
    if not matched_drugs:
        matched_drugs = fallback_search(query, limit)
        
    # Build list of drug details
    retrieved_data = []
    for drug_name in matched_drugs:
        if drug_name in DRUG_DATABASE:
            # Create copy and attach name
            item = DRUG_DATABASE[drug_name].copy()
            item["name"] = drug_name.capitalize()
            retrieved_data.append(item)
            
    return retrieved_data


def generate_chatbot_response(query: str) -> str:
    """Generates a structured medical response based on retrieved drug monographs, utilizing Gemini if available."""
    # Retrieve verified monographs
    monographs = retrieve_drug_monographs(query)
    
    # Construct context string
    context_str = ""
    if monographs:
        for m in monographs:
            context_str += f"Drug: {m['name']}\n"
            context_str += f"Category: {m['category']}\n"
            context_str += f"Purpose: {m['purpose']}\n"
            context_str += f"Common Side Effects: {', '.join(m['side_effects']['common'])}\n"
            context_str += f"Serious Warning Symptoms: {', '.join(m['side_effects']['serious'])}\n"
            context_str += f"Emergency: {', '.join(m['side_effects']['emergency'])}\n"
            context_str += f"Food Interaction: {', '.join(m['food_interactions'])}\n"
            context_str += f"Alcohol Risk ({m['alcohol_interaction']['risk_level']}): {m['alcohol_interaction']['effects']} - Precautions: {m['alcohol_interaction']['warnings']}\n"
            context_str += f"General Precautions: {', '.join(m['precautions'])}\n\n"
            
    # Try using Gemini
    if gemini_available:
        try:
            model = genai.GenerativeModel('gemini-flash-latest')
            system_prompt = (
                "You are MediGuard.AI, a highly respectful, empathetic, and conversational AI health assistant. "
                "You behave like a general assistant (similar to ChatGPT) to answer any queries, greetings, general safety questions, or conversational requests respectfully and helpfully.\n\n"
                "Here is the verified medical database context for the medications being discussed (if any):\n"
                f"{context_str}\n"
                "INSTRUCTIONS:\n"
                "1. For greetings, help requests, general medical science queries, or casual conversation, respond warmly and conversationally as a helpful assistant. Do NOT show drug warnings or say the drug is missing from the database.\n"
                "2. If the user asks about specific drug details (like usage, side effects, precautions, interactions) for a drug that IS present in the verified context, answer based on the provided context in a clean, bulleted format.\n"
                "3. If they ask specific clinical questions (like side effects, interactions, dosage warnings) for a drug that is NOT present in the verified context, politely inform them that you do not have verified monograph details for that specific drug in your current database. Mention that the database has full verified monographs for: Paracetamol, Ibuprofen, Aspirin, Warfarin, Metformin, Lisinopril, Azithromycin, Atorvastatin, and Amoxicillin. However, offer general, safe educational information if possible.\n"
                "4. Always include a brief medical disclaimer at the end of safety-related responses advising them to consult a healthcare professional."
            )
            response = model.generate_content(
                contents=[
                    {"role": "user", "parts": [f"System instructions:\n{system_prompt}\n\nUser message: {query}"]}
                ]
            )
            return response.text
        except Exception as e:
            print(f"Gemini API call failed: {e}. Falling back to local RAG generation.")

    # Fallback to local RAG generator if Gemini is unavailable or fails
    # Check if query is a simple greeting
    normalized_query = query.strip().lower().replace("?", "").replace("!", "").replace(".", "").replace(",", "")
    greetings = {
        "hello", "hi", "hey", "hola", "namaste", "salam", "heyy", "hey there", "hello there",
        "good morning", "good afternoon", "good evening", "how are you", "howdy", "hi there", "hallo"
    }
    words = normalized_query.split()
    if words and (words[0] in greetings or normalized_query in greetings) and len(words) <= 3:
        greeting_responses = [
            "Hello! I am your MediGuard.AI clinical safety assistant. How can I help you today? You can ask me about medication details, usage, food/alcohol interactions, or active ingredient overlaps.",
            "Greetings! Welcome to your MediGuard.AI safety console. I am ready to review your medication profile or answer safety queries. What would you like to check?",
            "Hello there! I'm here to support your medication safety journey. Feel free to ask about any drug's side effects, warnings, or dietary guidelines. How can I assist you right now?",
            "Namaste! I am your MediGuard.AI virtual safety assistant. I can help you understand your prescriptions, warn about drug interactions, and remind you of schedules. How can I serve you today?",
            "Hi! Welcome to MediGuard.AI. I am trained to cross-reference pharmacopoeias and highlight potential risks. Please let me know which medication or combination you have questions about."
        ]
        return random.choice(greeting_responses)

    if not monographs:
        return (
            "I couldn't find specific information regarding that medication in my database. "
            "MediGuard AI currently supports common medicines like Paracetamol, Ibuprofen, Aspirin, "
            "Warfarin, Metformin, Lisinopril, Azithromycin, Atorvastatin, and Amoxicillin.\n\n"
            "**Medical Disclaimer:** This is an AI safety checker. Please consult a qualified doctor or healthcare "
            "professional for medical advice, diagnoses, or prescriptions."
        )
        
    response_parts = []
    matched_names = [m["name"] for m in monographs]
    response_parts.append(f"Here is what I found in our verified medical database for **{', '.join(matched_names)}**:\n")
    
    for m in monographs:
        response_parts.append(f"### 💊 {m['name']} ({m['category']})")
        response_parts.append(f"**Purpose:** {m['purpose']}")
        response_parts.append("**Side Effects:**")
        response_parts.append(f"- *Common:* {', '.join(m['side_effects']['common'])}")
        response_parts.append(f"- *Serious (Contact Doctor):* {', '.join(m['side_effects']['serious'])}")
        response_parts.append(f"- *Emergency:* {', '.join(m['side_effects']['emergency'])}")
        response_parts.append("**Interactions & Warnings:**")
        response_parts.append(f"- *Food:* {', '.join(m['food_interactions'])}")
        response_parts.append(f"- *Alcohol Risk ({m['alcohol_interaction']['risk_level']}):* {m['alcohol_interaction']['effects']}")
        response_parts.append(f"**Precautions:** {', '.join(m['precautions'])}\n")
        
    response_parts.append(
        "🚨 **IMPORTANT DISCLAIMER:** MediGuard AI provides drug information for safety awareness and education only. "
        "It does not prescribe medications, recommend dosages, or substitute professional medical advice. "
        "If you are experiencing severe side effects or emergency symptoms, contact emergency healthcare services immediately."
    )
    return "\n".join(response_parts)


def text_to_speech_base64(text: str, lang: str = "en") -> str:
    """Converts a summary of the text to speech, returning a base64 encoded mp3 string."""
    try:
        # Clean markdown formatting from text for cleaner voice synthesis
        clean_text = text.replace("**", "").replace("###", "").replace("💊", "").replace("🚨", "")
        # Summarize to avoid massive TTS payloads
        lines = clean_text.split("\n")
        summary_lines = []
        for line in lines:
            # Grab key introductory info and disclaimers
            if line.startswith("Here is what") or "Purpose:" in line or "Alcohol Risk" in line or "IMPORTANT DISCLAIMER" in line:
                summary_lines.append(line)
        
        summary_text = " ".join(summary_lines)
        if not summary_text:
            summary_text = clean_text[:300]
            
        tts = gTTS(text=summary_text, lang=lang, slow=False)
        fp = BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        
        # Convert to base64
        audio_b64 = base64.b64encode(fp.read()).decode("utf-8")
        return audio_b64
    except Exception as e:
        print(f"Error generating TTS: {e}")
        return ""
