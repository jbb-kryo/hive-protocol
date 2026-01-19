export interface GlossaryTerm {
  term: string
  slug: string
  shortDefinition: string
  fullDefinition: string
  category: string
  relatedTerms: string[]
  seeAlso?: { text: string; href: string }[]
}

export const glossaryCategories = [
  'AI Fundamentals',
  'Machine Learning',
  'Natural Language Processing',
  'Agent Systems',
  'Neural Networks',
  'AI Safety & Ethics',
  'Infrastructure',
] as const

export type GlossaryCategory = (typeof glossaryCategories)[number]

export const glossaryTerms: GlossaryTerm[] = [
  {
    term: 'AI Agent',
    slug: 'ai-agent',
    shortDefinition: 'An autonomous software program that perceives its environment, makes decisions, and takes actions to achieve specific goals.',
    fullDefinition: 'An AI agent is an autonomous software system powered by artificial intelligence that can perceive its environment through sensors or data inputs, process information using machine learning models, make decisions based on its objectives, and take actions to achieve specific goals. Unlike simple chatbots that respond to direct queries, AI agents can operate autonomously, use tools, maintain context across interactions, and work toward complex multi-step objectives. Modern AI agents are typically built on large language models (LLMs) and can be specialized for tasks like research, coding, customer support, or data analysis.',
    category: 'Agent Systems',
    relatedTerms: ['multi-agent-system', 'autonomous-agent', 'llm', 'tool-use'],
    seeAlso: [{ text: 'Create your first agent', href: '/docs/getting-started/quickstart' }],
  },
  {
    term: 'Artificial Intelligence',
    slug: 'artificial-intelligence',
    shortDefinition: 'The simulation of human intelligence processes by computer systems, including learning, reasoning, and self-correction.',
    fullDefinition: 'Artificial Intelligence (AI) refers to the development of computer systems capable of performing tasks that typically require human intelligence. These tasks include visual perception, speech recognition, decision-making, language translation, and problem-solving. AI encompasses multiple subfields including machine learning, deep learning, natural language processing, and computer vision. Modern AI systems range from narrow AI (specialized for specific tasks) to ongoing research toward artificial general intelligence (AGI) that could match human cognitive abilities across domains.',
    category: 'AI Fundamentals',
    relatedTerms: ['machine-learning', 'deep-learning', 'neural-network', 'agi'],
  },
  {
    term: 'Autonomous Agent',
    slug: 'autonomous-agent',
    shortDefinition: 'An AI system that can operate independently without constant human supervision, making decisions and taking actions on its own.',
    fullDefinition: 'An autonomous agent is an AI system designed to operate with minimal human intervention. It can perceive its environment, make decisions based on its programming and learned behaviors, and execute actions to achieve its goals. Autonomous agents differ from assistive AI in their ability to work independently over extended periods. Key characteristics include goal-directed behavior, environmental awareness, adaptive learning, and the capacity for self-initiated actions. In the context of HIVE, autonomous agents can be configured with different levels of autonomy through human-in-the-loop controls.',
    category: 'Agent Systems',
    relatedTerms: ['ai-agent', 'human-in-the-loop', 'multi-agent-system'],
    seeAlso: [{ text: 'Human-in-the-loop modes', href: '/features' }],
  },
  {
    term: 'Chain of Thought',
    slug: 'chain-of-thought',
    shortDefinition: 'A prompting technique that encourages AI models to break down complex problems into intermediate reasoning steps.',
    fullDefinition: 'Chain of Thought (CoT) is a prompting strategy that improves AI reasoning by encouraging models to generate intermediate steps before arriving at a final answer. Instead of producing direct responses, the model "thinks out loud," showing its reasoning process. This technique significantly improves performance on complex tasks requiring multi-step reasoning, mathematical problem-solving, and logical deduction. CoT prompting can be implemented through few-shot examples or zero-shot instructions like "Let\'s think step by step."',
    category: 'Natural Language Processing',
    relatedTerms: ['prompt-engineering', 'few-shot-learning', 'reasoning'],
  },
  {
    term: 'Chatbot',
    slug: 'chatbot',
    shortDefinition: 'A software application designed to simulate human conversation through text or voice interactions.',
    fullDefinition: 'A chatbot is a computer program that simulates human conversation through text or voice interactions. Early chatbots relied on rule-based systems with predefined responses, while modern chatbots leverage natural language processing (NLP) and machine learning to understand context and generate more natural responses. Chatbots range from simple FAQ bots to sophisticated conversational AI powered by large language models. Unlike AI agents, traditional chatbots typically respond reactively to user inputs rather than taking autonomous actions.',
    category: 'Natural Language Processing',
    relatedTerms: ['conversational-ai', 'nlp', 'ai-agent'],
  },
  {
    term: 'Context Window',
    slug: 'context-window',
    shortDefinition: 'The maximum amount of text (measured in tokens) that an AI model can process in a single interaction.',
    fullDefinition: 'A context window refers to the maximum number of tokens (words, subwords, or characters) that a language model can consider when generating a response. This includes both the input prompt and the generated output. Models with larger context windows can process longer documents, maintain context across extended conversations, and handle more complex tasks. For example, GPT-4 has context windows ranging from 8K to 128K tokens, while Claude offers up to 200K tokens. Context window size significantly impacts an agent\'s ability to work with large codebases, documents, or conversation histories.',
    category: 'Natural Language Processing',
    relatedTerms: ['token', 'llm', 'prompt'],
  },
  {
    term: 'Conversational AI',
    slug: 'conversational-ai',
    shortDefinition: 'AI systems designed to engage in natural, human-like dialogue across multiple turns of conversation.',
    fullDefinition: 'Conversational AI encompasses technologies that enable computers to understand, process, and respond to human language in a natural, contextual manner. Unlike simple chatbots, conversational AI systems can maintain context across multiple exchanges, understand nuance and intent, handle complex queries, and adapt their responses based on conversation history. These systems combine NLP, machine learning, and dialogue management to create human-like interactions. Applications include virtual assistants, customer service automation, and AI agents.',
    category: 'Natural Language Processing',
    relatedTerms: ['chatbot', 'nlp', 'dialogue-system'],
  },
  {
    term: 'Deep Learning',
    slug: 'deep-learning',
    shortDefinition: 'A subset of machine learning using neural networks with multiple layers to learn complex patterns from data.',
    fullDefinition: 'Deep learning is a machine learning technique that uses artificial neural networks with multiple layers (hence "deep") to progressively extract higher-level features from raw input. Each layer transforms the data into increasingly abstract representations. Deep learning has achieved breakthrough performance in image recognition, speech recognition, natural language processing, and game playing. Key architectures include convolutional neural networks (CNNs) for images, recurrent neural networks (RNNs) for sequences, and transformers for language. The success of large language models is built on deep learning foundations.',
    category: 'Machine Learning',
    relatedTerms: ['neural-network', 'machine-learning', 'transformer'],
  },
  {
    term: 'Embedding',
    slug: 'embedding',
    shortDefinition: 'A numerical representation of data (text, images, etc.) as vectors in a high-dimensional space.',
    fullDefinition: 'An embedding is a learned representation that maps discrete objects (words, sentences, images, users) into continuous vector spaces. In NLP, word embeddings represent words as dense vectors where semantically similar words are closer together. Sentence and document embeddings extend this concept to longer text. Embeddings enable AI systems to understand similarity, perform semantic search, and transfer knowledge between tasks. They are fundamental to retrieval-augmented generation (RAG), recommendation systems, and vector databases used in modern AI applications.',
    category: 'Machine Learning',
    relatedTerms: ['vector-database', 'semantic-search', 'rag'],
  },
  {
    term: 'Few-Shot Learning',
    slug: 'few-shot-learning',
    shortDefinition: 'A machine learning approach where models learn to perform tasks from only a few examples.',
    fullDefinition: 'Few-shot learning enables AI models to learn new tasks from a small number of examples, typically 1-10 demonstrations. This contrasts with traditional machine learning that requires thousands of labeled examples. In the context of LLMs, few-shot learning is implemented through in-context learning, where examples are provided in the prompt. The model generalizes patterns from these examples to perform the task on new inputs. Few-shot prompting is a key technique for customizing AI behavior without fine-tuning the underlying model.',
    category: 'Machine Learning',
    relatedTerms: ['zero-shot-learning', 'prompt-engineering', 'in-context-learning'],
  },
  {
    term: 'Fine-Tuning',
    slug: 'fine-tuning',
    shortDefinition: 'The process of further training a pre-trained AI model on a specific dataset to adapt it for particular tasks.',
    fullDefinition: 'Fine-tuning is the process of taking a pre-trained model and training it further on a smaller, task-specific dataset. This transfers the general knowledge learned during pre-training to specialized applications. Fine-tuning is more efficient than training from scratch and often requires significantly less data. Common approaches include full fine-tuning (updating all parameters), parameter-efficient fine-tuning (updating a subset), and techniques like LoRA that add trainable adapters. Fine-tuning allows organizations to create custom models optimized for their specific use cases.',
    category: 'Machine Learning',
    relatedTerms: ['transfer-learning', 'pre-training', 'lora'],
  },
  {
    term: 'Foundation Model',
    slug: 'foundation-model',
    shortDefinition: 'A large AI model trained on broad data that can be adapted for many downstream tasks.',
    fullDefinition: 'A foundation model is a large-scale AI model trained on vast amounts of diverse data that serves as a base for many downstream applications. These models learn general-purpose representations that transfer across tasks. Examples include GPT-4 (language), DALL-E (images), and Whisper (speech). Foundation models are characterized by their scale, broad training data, emergent capabilities, and adaptability through fine-tuning or prompting. They represent a paradigm shift from task-specific models to general-purpose systems that can be specialized for various applications.',
    category: 'AI Fundamentals',
    relatedTerms: ['llm', 'pre-training', 'transfer-learning'],
  },
  {
    term: 'Generative AI',
    slug: 'generative-ai',
    shortDefinition: 'AI systems that can create new content including text, images, code, audio, and video.',
    fullDefinition: 'Generative AI refers to artificial intelligence systems capable of creating new content that resembles human-created work. This includes text generation (GPT, Claude), image creation (DALL-E, Midjourney, Stable Diffusion), code generation (Copilot, Codex), music composition, and video synthesis. These systems learn patterns from training data and generate novel outputs based on user prompts. Generative AI is powered by architectures like transformers, diffusion models, and GANs. Applications span creative work, content creation, software development, and enterprise automation.',
    category: 'AI Fundamentals',
    relatedTerms: ['llm', 'diffusion-model', 'transformer'],
  },
  {
    term: 'Hallucination',
    slug: 'hallucination',
    shortDefinition: 'When an AI model generates plausible-sounding but factually incorrect or fabricated information.',
    fullDefinition: 'Hallucination in AI refers to instances where models generate content that appears coherent and confident but is factually incorrect, nonsensical, or completely fabricated. This occurs because language models are trained to predict likely text sequences rather than verify factual accuracy. Hallucinations can include invented facts, false citations, non-existent URLs, or contradictory statements. Mitigation strategies include retrieval-augmented generation (RAG), fact-checking systems, confidence calibration, and human oversight. Understanding hallucination risk is critical for deploying AI in high-stakes applications.',
    category: 'AI Safety & Ethics',
    relatedTerms: ['rag', 'grounding', 'factuality'],
  },
  {
    term: 'Human-in-the-Loop',
    slug: 'human-in-the-loop',
    shortDefinition: 'AI systems designed to incorporate human judgment, oversight, or intervention at key decision points.',
    fullDefinition: 'Human-in-the-loop (HITL) is an AI design paradigm that integrates human oversight into automated systems. Rather than fully autonomous operation, HITL systems allow humans to review, approve, modify, or override AI decisions at critical points. This approach balances the efficiency of automation with the judgment and accountability of human involvement. HITL is essential for high-stakes applications, quality assurance, continuous learning, and building trust in AI systems. HIVE implements HITL through three modes: Observe (monitor), Collaborate (suggest), and Direct (command).',
    category: 'Agent Systems',
    relatedTerms: ['autonomous-agent', 'ai-safety', 'oversight'],
    seeAlso: [{ text: 'HITL modes in HIVE', href: '/features' }],
  },
  {
    term: 'In-Context Learning',
    slug: 'in-context-learning',
    shortDefinition: 'The ability of language models to learn and adapt to new tasks from examples provided in the prompt.',
    fullDefinition: 'In-context learning (ICL) is an emergent capability of large language models to learn new tasks from examples or instructions provided within the prompt, without updating model parameters. The model adapts its behavior based on the context provided in each interaction. ICL encompasses zero-shot learning (task description only), few-shot learning (a few examples), and many-shot learning (many examples). This capability enables rapid prototyping and customization of AI behavior without the cost and complexity of fine-tuning.',
    category: 'Natural Language Processing',
    relatedTerms: ['few-shot-learning', 'prompt-engineering', 'llm'],
  },
  {
    term: 'Inference',
    slug: 'inference',
    shortDefinition: 'The process of using a trained AI model to make predictions or generate outputs from new inputs.',
    fullDefinition: 'Inference is the process of running a trained machine learning model on new data to generate predictions, classifications, or content. While training involves learning from data to update model parameters, inference uses the fixed trained model to process new inputs. Inference optimization is crucial for production AI systems, focusing on speed (latency), cost (compute resources), and throughput (requests per second). Techniques include quantization, pruning, batching, and specialized inference hardware like GPUs and TPUs.',
    category: 'Machine Learning',
    relatedTerms: ['training', 'latency', 'throughput'],
  },
  {
    term: 'Large Language Model',
    slug: 'llm',
    shortDefinition: 'An AI model trained on vast text data that can understand and generate human-like language.',
    fullDefinition: 'A Large Language Model (LLM) is a neural network trained on massive amounts of text data to understand and generate human language. LLMs use transformer architecture and are characterized by their scale (billions of parameters), training data (trillions of tokens), and emergent capabilities like reasoning, coding, and instruction following. Notable examples include GPT-4, Claude, Gemini, and Llama. LLMs form the foundation of modern AI agents, chatbots, and generative AI applications. They can be accessed via APIs or deployed on-premises.',
    category: 'Natural Language Processing',
    relatedTerms: ['transformer', 'foundation-model', 'generative-ai'],
    seeAlso: [{ text: 'Supported models', href: '/integrations' }],
  },
  {
    term: 'Machine Learning',
    slug: 'machine-learning',
    shortDefinition: 'A subset of AI where systems learn patterns from data to make predictions without explicit programming.',
    fullDefinition: 'Machine Learning (ML) is a branch of artificial intelligence where algorithms learn patterns from data to make predictions or decisions without being explicitly programmed for each scenario. ML encompasses supervised learning (learning from labeled examples), unsupervised learning (finding patterns in unlabeled data), and reinforcement learning (learning through trial and feedback). Key techniques include regression, classification, clustering, and neural networks. ML powers recommendation systems, fraud detection, image recognition, and language models.',
    category: 'Machine Learning',
    relatedTerms: ['deep-learning', 'supervised-learning', 'neural-network'],
  },
  {
    term: 'Multi-Agent System',
    slug: 'multi-agent-system',
    shortDefinition: 'A system where multiple AI agents work together, communicating and coordinating to solve complex problems.',
    fullDefinition: 'A Multi-Agent System (MAS) consists of multiple AI agents that interact, communicate, and coordinate to achieve shared or individual goals. Each agent may have specialized capabilities, knowledge, or roles. MAS can solve problems too complex for single agents through division of labor, parallel processing, and collaborative reasoning. Key concepts include agent communication protocols, coordination mechanisms, emergent behavior, and conflict resolution. HIVE\'s swarms are multi-agent systems where specialized agents collaborate on complex tasks.',
    category: 'Agent Systems',
    relatedTerms: ['ai-agent', 'swarm', 'agent-coordination'],
    seeAlso: [{ text: 'Create a swarm', href: '/docs/swarms/creating-swarms' }],
  },
  {
    term: 'Natural Language Processing',
    slug: 'nlp',
    shortDefinition: 'The field of AI focused on enabling computers to understand, interpret, and generate human language.',
    fullDefinition: 'Natural Language Processing (NLP) is a branch of artificial intelligence that focuses on the interaction between computers and human language. NLP encompasses understanding text (comprehension, sentiment analysis, entity recognition), generating text (summarization, translation, content creation), and conversation (dialogue systems, question answering). Modern NLP is dominated by transformer-based models that achieve human-level performance on many benchmarks. Applications include search engines, virtual assistants, content moderation, and language translation.',
    category: 'Natural Language Processing',
    relatedTerms: ['llm', 'transformer', 'tokenization'],
  },
  {
    term: 'Neural Network',
    slug: 'neural-network',
    shortDefinition: 'A computing system inspired by biological neurons that learns patterns through interconnected nodes.',
    fullDefinition: 'A neural network is a computational model inspired by the structure and function of biological neural networks in the brain. It consists of interconnected nodes (neurons) organized in layers that process information through weighted connections. Neural networks learn by adjusting these weights during training to minimize prediction errors. Architectures range from simple feedforward networks to complex structures like convolutional neural networks (CNNs), recurrent neural networks (RNNs), and transformers. Neural networks are the foundation of deep learning and modern AI.',
    category: 'Neural Networks',
    relatedTerms: ['deep-learning', 'transformer', 'backpropagation'],
  },
  {
    term: 'Prompt',
    slug: 'prompt',
    shortDefinition: 'The input text or instructions given to an AI model to guide its response or behavior.',
    fullDefinition: 'A prompt is the input provided to an AI model to elicit a specific response or behavior. Prompts can range from simple questions to complex instructions with context, examples, and formatting requirements. The art of crafting effective prompts (prompt engineering) significantly impacts AI output quality. Components of a prompt may include system instructions, context, examples, the user query, and output format specifications. In agent systems, prompts often include the agent\'s role, capabilities, available tools, and behavioral guidelines.',
    category: 'Natural Language Processing',
    relatedTerms: ['prompt-engineering', 'system-prompt', 'in-context-learning'],
  },
  {
    term: 'Prompt Engineering',
    slug: 'prompt-engineering',
    shortDefinition: 'The practice of designing and optimizing prompts to get better outputs from AI models.',
    fullDefinition: 'Prompt engineering is the practice of crafting and optimizing input prompts to elicit desired behaviors and outputs from AI models. Techniques include clear instruction writing, providing examples (few-shot), breaking down complex tasks (chain-of-thought), specifying output formats, and iterative refinement. Effective prompt engineering can dramatically improve AI performance without model changes. Skills include understanding model capabilities, systematic testing, and adapting prompts for different use cases. Prompt engineering is essential for building AI agents and applications.',
    category: 'Natural Language Processing',
    relatedTerms: ['prompt', 'few-shot-learning', 'chain-of-thought'],
  },
  {
    term: 'RAG',
    slug: 'rag',
    shortDefinition: 'Retrieval-Augmented Generation: A technique that enhances AI responses by retrieving relevant information from external sources.',
    fullDefinition: 'Retrieval-Augmented Generation (RAG) is a technique that combines information retrieval with text generation to produce more accurate, up-to-date, and grounded AI responses. When a query arrives, RAG systems first search a knowledge base (documents, databases, APIs) for relevant information, then include this context in the prompt for the language model. This reduces hallucinations, enables access to current information beyond training data, and allows AI to cite sources. RAG is fundamental for enterprise AI applications requiring factual accuracy.',
    category: 'Natural Language Processing',
    relatedTerms: ['embedding', 'vector-database', 'knowledge-base'],
  },
  {
    term: 'Reinforcement Learning',
    slug: 'reinforcement-learning',
    shortDefinition: 'A machine learning paradigm where agents learn optimal behaviors through trial, error, and reward signals.',
    fullDefinition: 'Reinforcement Learning (RL) is a machine learning paradigm where an agent learns to make decisions by interacting with an environment and receiving feedback in the form of rewards or penalties. The agent aims to maximize cumulative reward over time through trial and error. Key concepts include states, actions, policies, and value functions. RL has achieved superhuman performance in games (AlphaGo, Atari) and is used for robotics, recommendation systems, and fine-tuning LLMs through RLHF (Reinforcement Learning from Human Feedback).',
    category: 'Machine Learning',
    relatedTerms: ['rlhf', 'machine-learning', 'policy'],
  },
  {
    term: 'RLHF',
    slug: 'rlhf',
    shortDefinition: 'Reinforcement Learning from Human Feedback: Training AI models to align with human preferences through human-rated responses.',
    fullDefinition: 'Reinforcement Learning from Human Feedback (RLHF) is a technique for training AI models to produce outputs that align with human preferences. The process involves collecting human ratings of model outputs, training a reward model on these preferences, and using reinforcement learning to optimize the AI model against the reward model. RLHF is crucial for making LLMs helpful, harmless, and honest. It has been instrumental in developing conversational AI like ChatGPT and Claude, transforming raw language models into useful assistants.',
    category: 'Machine Learning',
    relatedTerms: ['reinforcement-learning', 'fine-tuning', 'alignment'],
  },
  {
    term: 'Semantic Search',
    slug: 'semantic-search',
    shortDefinition: 'Search technology that understands the meaning and intent behind queries, not just keyword matching.',
    fullDefinition: 'Semantic search is an information retrieval approach that understands the meaning and context of search queries rather than relying solely on keyword matching. It uses embeddings and vector similarity to find conceptually related content even when exact words differ. For example, a search for "how to fix a flat tire" would match content about "changing a punctured wheel." Semantic search powers modern AI applications including RAG systems, knowledge bases, and intelligent document retrieval. It significantly improves search relevance and user experience.',
    category: 'Natural Language Processing',
    relatedTerms: ['embedding', 'vector-database', 'rag'],
  },
  {
    term: 'Swarm',
    slug: 'swarm',
    shortDefinition: 'A coordinated group of AI agents working together on shared tasks in HIVE.',
    fullDefinition: 'In HIVE, a swarm is a coordinated group of AI agents that collaborate to accomplish complex tasks. Each agent in a swarm can have specialized roles, different underlying models, and unique tool access. Swarms enable division of labor, parallel processing, and collaborative problem-solving that exceeds individual agent capabilities. Key features include real-time communication between agents, shared context blocks, human-in-the-loop controls, and cryptographic verification of agent messages. Swarms can tackle complex workflows like research projects, code reviews, or customer support.',
    category: 'Agent Systems',
    relatedTerms: ['multi-agent-system', 'ai-agent', 'agent-coordination'],
    seeAlso: [{ text: 'Swarm documentation', href: '/docs/swarms/creating-swarms' }],
  },
  {
    term: 'System Prompt',
    slug: 'system-prompt',
    shortDefinition: 'Instructions that define an AI agent\'s role, personality, capabilities, and behavioral guidelines.',
    fullDefinition: 'A system prompt is a set of instructions provided to an AI model that defines its role, persona, capabilities, constraints, and behavioral guidelines. Unlike user prompts that contain specific queries, system prompts establish the overall context and rules that govern all interactions. Effective system prompts specify the agent\'s expertise, communication style, ethical boundaries, available tools, and output formats. System prompts are fundamental to creating specialized AI agents with consistent, predictable behavior aligned with application requirements.',
    category: 'Natural Language Processing',
    relatedTerms: ['prompt', 'ai-agent', 'prompt-engineering'],
  },
  {
    term: 'Token',
    slug: 'token',
    shortDefinition: 'The basic unit of text that AI language models process, typically representing words, subwords, or characters.',
    fullDefinition: 'A token is the fundamental unit of text that language models process. Tokenization breaks text into tokens which may be words, subwords, or characters depending on the tokenizer. For example, "unbelievable" might be tokenized as ["un", "believ", "able"]. Token count determines processing cost, context window usage, and API pricing. Different models use different tokenizers; a rough estimate is 1 token per 4 characters or 0.75 words in English. Understanding tokenization is important for optimizing prompts and managing costs.',
    category: 'Natural Language Processing',
    relatedTerms: ['context-window', 'llm', 'tokenization'],
  },
  {
    term: 'Tool Use',
    slug: 'tool-use',
    shortDefinition: 'The capability of AI agents to invoke external functions, APIs, or services to accomplish tasks.',
    fullDefinition: 'Tool use (also called function calling) is the ability of AI agents to invoke external functions, APIs, or services to extend their capabilities beyond pure language generation. Tools enable agents to search the web, query databases, execute code, send emails, or interact with any external system. The agent decides when to use a tool, selects appropriate parameters, interprets results, and incorporates findings into its response. Tool use transforms language models from knowledge sources into capable actors that can take real-world actions.',
    category: 'Agent Systems',
    relatedTerms: ['ai-agent', 'function-calling', 'api'],
    seeAlso: [{ text: 'Build custom tools', href: '/tools' }],
  },
  {
    term: 'Transformer',
    slug: 'transformer',
    shortDefinition: 'A neural network architecture using self-attention mechanisms, powering modern language models.',
    fullDefinition: 'The Transformer is a neural network architecture introduced in 2017 that revolutionized NLP and AI. Unlike previous sequential models (RNNs), Transformers process entire sequences in parallel using self-attention mechanisms that weigh the importance of different input parts. Key innovations include multi-head attention, positional encodings, and the encoder-decoder structure. Transformers enable efficient training on massive datasets and scale to billions of parameters. They power virtually all modern language models (GPT, Claude, Gemini, Llama) and have been adapted for vision, audio, and multimodal applications.',
    category: 'Neural Networks',
    relatedTerms: ['attention', 'llm', 'deep-learning'],
  },
  {
    term: 'Vector Database',
    slug: 'vector-database',
    shortDefinition: 'A database optimized for storing and querying high-dimensional vector embeddings for similarity search.',
    fullDefinition: 'A vector database is a specialized database designed to store, index, and query high-dimensional vector embeddings efficiently. Unlike traditional databases that match exact values, vector databases find similar items using distance metrics like cosine similarity or Euclidean distance. They are essential for AI applications including semantic search, RAG systems, recommendation engines, and image similarity. Popular vector databases include Pinecone, Weaviate, Milvus, and pgvector. They handle millions to billions of vectors while providing millisecond query latency.',
    category: 'Infrastructure',
    relatedTerms: ['embedding', 'semantic-search', 'rag'],
  },
  {
    term: 'Zero-Shot Learning',
    slug: 'zero-shot-learning',
    shortDefinition: 'The ability of AI models to perform tasks they were not explicitly trained on, using only task descriptions.',
    fullDefinition: 'Zero-shot learning is the capability of AI models to perform tasks without any task-specific training examples, relying solely on the task description or instructions. Large language models exhibit remarkable zero-shot abilities, correctly performing tasks like translation, summarization, or classification based only on natural language instructions. This emergent capability arises from the vast knowledge and patterns learned during pre-training. Zero-shot learning enables rapid deployment of AI for new use cases without collecting training data or fine-tuning.',
    category: 'Machine Learning',
    relatedTerms: ['few-shot-learning', 'in-context-learning', 'transfer-learning'],
  },
  {
    term: 'AGI',
    slug: 'agi',
    shortDefinition: 'Artificial General Intelligence: Hypothetical AI with human-level cognitive abilities across all domains.',
    fullDefinition: 'Artificial General Intelligence (AGI) refers to hypothetical AI systems that possess human-level cognitive abilities across all intellectual domains. Unlike narrow AI (specialized for specific tasks), AGI would be able to learn, reason, and solve problems in any area without task-specific training. AGI would demonstrate common sense, transfer learning, abstract thinking, and creativity comparable to humans. While current AI excels at specific tasks, true AGI remains a research goal. The timeline and feasibility of AGI are subjects of ongoing debate in the AI community.',
    category: 'AI Fundamentals',
    relatedTerms: ['artificial-intelligence', 'narrow-ai', 'superintelligence'],
  },
  {
    term: 'AI Alignment',
    slug: 'alignment',
    shortDefinition: 'The challenge of ensuring AI systems behave in accordance with human values and intentions.',
    fullDefinition: 'AI alignment is the research field focused on ensuring that artificial intelligence systems act in accordance with human values, intentions, and goals. As AI systems become more capable, alignment becomes critical for safety. Challenges include specifying human values precisely, handling value conflicts, maintaining alignment as systems become more autonomous, and preventing unintended behaviors. Techniques include RLHF, constitutional AI, interpretability research, and formal verification. Alignment is considered one of the most important challenges in AI development.',
    category: 'AI Safety & Ethics',
    relatedTerms: ['rlhf', 'ai-safety', 'value-alignment'],
  },
  {
    term: 'AI Safety',
    slug: 'ai-safety',
    shortDefinition: 'The field focused on ensuring AI systems operate reliably, securely, and beneficially.',
    fullDefinition: 'AI safety encompasses research and practices aimed at ensuring artificial intelligence systems operate reliably, securely, and beneficially. This includes preventing harmful outputs, maintaining robustness against adversarial attacks, ensuring transparency in AI decision-making, and developing systems that remain controllable as they become more capable. AI safety research addresses both near-term concerns (bias, misinformation, misuse) and long-term risks (loss of control, existential risk). Organizations like Anthropic, OpenAI, and DeepMind invest significantly in safety research.',
    category: 'AI Safety & Ethics',
    relatedTerms: ['alignment', 'human-in-the-loop', 'responsible-ai'],
  },
  {
    term: 'Attention Mechanism',
    slug: 'attention',
    shortDefinition: 'A neural network component that allows models to focus on relevant parts of the input when producing outputs.',
    fullDefinition: 'Attention mechanisms allow neural networks to dynamically focus on relevant parts of the input when producing each part of the output. Instead of processing inputs uniformly, attention computes importance weights that determine how much each input element contributes to each output. Self-attention (used in Transformers) allows every position to attend to every other position in the same sequence. Multi-head attention uses multiple attention functions in parallel to capture different types of relationships. Attention is the key innovation enabling modern language models.',
    category: 'Neural Networks',
    relatedTerms: ['transformer', 'neural-network', 'self-attention'],
  },
  {
    term: 'Multimodal AI',
    slug: 'multimodal-ai',
    shortDefinition: 'AI systems that can process and generate multiple types of data like text, images, audio, and video.',
    fullDefinition: 'Multimodal AI refers to systems capable of understanding and generating multiple types of data (modalities) such as text, images, audio, and video. These models can process inputs across modalities (describing an image in text), transfer information between modalities (generating images from text), and reason about multimodal content. Examples include GPT-4V (vision), Gemini, and DALL-E. Multimodal capabilities enable richer applications like visual question answering, image captioning, video analysis, and more natural human-AI interaction.',
    category: 'AI Fundamentals',
    relatedTerms: ['llm', 'computer-vision', 'speech-recognition'],
  },
  {
    term: 'Model Context Protocol',
    slug: 'mcp',
    shortDefinition: 'A standard protocol for connecting AI models to external data sources, tools, and services.',
    fullDefinition: 'Model Context Protocol (MCP) is an emerging standard for connecting AI models to external context sources including databases, APIs, files, and tools. MCP provides a unified interface for AI systems to access real-time information, execute actions, and integrate with enterprise systems. This standardization simplifies building AI applications that need to interact with multiple data sources and services. MCP enables more grounded, capable AI agents that can access authoritative information and take meaningful actions in the real world.',
    category: 'Infrastructure',
    relatedTerms: ['tool-use', 'rag', 'ai-agent'],
  },
  {
    term: 'Temperature',
    slug: 'temperature',
    shortDefinition: 'A parameter controlling the randomness and creativity of AI model outputs.',
    fullDefinition: 'Temperature is a parameter that controls the randomness of AI model outputs during text generation. Lower temperatures (0-0.3) produce more deterministic, focused responses by favoring high-probability tokens. Higher temperatures (0.7-1.0+) increase randomness and creativity by giving lower-probability tokens more chance of selection. Temperature 0 produces the most likely output every time. For factual tasks, low temperature ensures consistency; for creative tasks, higher temperature encourages diverse outputs. Temperature is a key parameter for tuning AI behavior in applications.',
    category: 'Natural Language Processing',
    relatedTerms: ['inference', 'sampling', 'top-p'],
  },
]

export function getTermBySlug(slug: string): GlossaryTerm | undefined {
  return glossaryTerms.find((term) => term.slug === slug)
}

export function getTermsByCategory(category: string): GlossaryTerm[] {
  return glossaryTerms.filter((term) => term.category === category)
}

export function searchTerms(query: string): GlossaryTerm[] {
  const lowerQuery = query.toLowerCase()
  return glossaryTerms.filter(
    (term) =>
      term.term.toLowerCase().includes(lowerQuery) ||
      term.shortDefinition.toLowerCase().includes(lowerQuery)
  )
}

export function getAlphabeticalGroups(): { letter: string; terms: GlossaryTerm[] }[] {
  const groups: { [key: string]: GlossaryTerm[] } = {}

  glossaryTerms
    .sort((a, b) => a.term.localeCompare(b.term))
    .forEach((term) => {
      const letter = term.term[0].toUpperCase()
      if (!groups[letter]) {
        groups[letter] = []
      }
      groups[letter].push(term)
    })

  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, terms]) => ({ letter, terms }))
}
