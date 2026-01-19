import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TestRequest {
  integrationType: string;
  credentials: Record<string, string>;
}

interface TestResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

async function testWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Connection timed out')), timeoutMs);
  });
  return Promise.race([promise, timeout]);
}

async function testAnthropic(apiKey: string): Promise<TestResult> {
  try {
    const response = await testWithTimeout(
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      })
    );

    if (response.status === 401) {
      return { success: false, message: 'Invalid API key. Please check your credentials.' };
    }
    if (response.status === 429) {
      return { success: false, message: 'Rate limit exceeded. Please try again later.' };
    }
    if (response.status === 400) {
      const data = await response.json();
      if (data.error?.type === 'invalid_request_error') {
        return { success: true, message: 'API key is valid. Connection successful.' };
      }
    }
    if (response.ok) {
      return { success: true, message: 'Connection successful. Anthropic API is accessible.' };
    }

    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      message: errorData.error?.message || `Connection failed with status ${response.status}`,
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'Connection timed out') {
      return { success: false, message: 'Connection timed out. Please try again.' };
    }
    return { success: false, message: 'Failed to connect to Anthropic API.' };
  }
}

async function testOpenAI(apiKey: string): Promise<TestResult> {
  try {
    const response = await testWithTimeout(
      fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      })
    );

    if (response.status === 401) {
      return { success: false, message: 'Invalid API key. Please check your credentials.' };
    }
    if (response.status === 429) {
      return { success: false, message: 'Rate limit exceeded. Please try again later.' };
    }
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'Connection successful. OpenAI API is accessible.',
        details: { modelsAvailable: data.data?.length || 0 },
      };
    }

    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      message: errorData.error?.message || `Connection failed with status ${response.status}`,
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'Connection timed out') {
      return { success: false, message: 'Connection timed out. Please try again.' };
    }
    return { success: false, message: 'Failed to connect to OpenAI API.' };
  }
}

async function testHuggingFace(token: string, endpoint?: string): Promise<TestResult> {
  try {
    const url = endpoint || 'https://api-inference.huggingface.co/models/gpt2';
    
    const response = await testWithTimeout(
      fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: 'test' }),
      })
    );

    if (response.status === 401) {
      return { success: false, message: 'Invalid API token. Please check your credentials.' };
    }
    if (response.status === 429) {
      return { success: false, message: 'Rate limit exceeded. Please try again later.' };
    }
    if (response.status === 503) {
      return { success: true, message: 'API token is valid. Model is loading (this is normal).' };
    }
    if (response.ok) {
      return { success: true, message: 'Connection successful. HuggingFace API is accessible.' };
    }

    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      message: errorData.error || `Connection failed with status ${response.status}`,
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'Connection timed out') {
      return { success: false, message: 'Connection timed out. Please try again.' };
    }
    return { success: false, message: 'Failed to connect to HuggingFace API.' };
  }
}

async function testLocalServer(url: string): Promise<TestResult> {
  try {
    const baseUrl = url.replace(/\/$/, '');
    const modelsUrl = `${baseUrl}/models`;
    
    const response = await testWithTimeout(
      fetch(modelsUrl, { method: 'GET' }),
      5000
    );

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        success: true,
        message: 'Connection successful. Local server is accessible.',
        details: { modelsAvailable: data.data?.length || 0 },
      };
    }

    return {
      success: false,
      message: `Server responded with status ${response.status}. Make sure the server is running.`,
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'Connection timed out') {
      return { success: false, message: 'Connection timed out. Is the server running?' };
    }
    return {
      success: false,
      message: 'Could not connect to server. Please verify the URL and ensure the server is running.',
    };
  }
}

async function testOllama(url: string): Promise<TestResult> {
  try {
    const baseUrl = url.replace(/\/$/, '');
    const tagsUrl = `${baseUrl}/api/tags`;
    
    const response = await testWithTimeout(
      fetch(tagsUrl, { method: 'GET' }),
      5000
    );

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      const models = data.models || [];
      return {
        success: true,
        message: `Connection successful. Found ${models.length} model(s) available.`,
        details: { models: models.map((m: { name: string }) => m.name) },
      };
    }

    return {
      success: false,
      message: `Server responded with status ${response.status}. Make sure Ollama is running.`,
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'Connection timed out') {
      return { success: false, message: 'Connection timed out. Is Ollama running?' };
    }
    return {
      success: false,
      message: 'Could not connect to Ollama. Please verify the URL and ensure Ollama is running.',
    };
  }
}

async function testCustomLLM(baseUrl: string, apiKey?: string): Promise<TestResult> {
  try {
    const url = `${baseUrl.replace(/\/$/, '')}/models`;
    const headers: Record<string, string> = {};
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const response = await testWithTimeout(
      fetch(url, { method: 'GET', headers }),
      10000
    );

    if (response.status === 401) {
      return { success: false, message: 'Authentication failed. Please check your API key.' };
    }
    if (response.ok) {
      return { success: true, message: 'Connection successful. Endpoint is accessible.' };
    }

    return {
      success: false,
      message: `Connection failed with status ${response.status}`,
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'Connection timed out') {
      return { success: false, message: 'Connection timed out. Please try again.' };
    }
    return { success: false, message: 'Could not connect to endpoint. Please verify the URL.' };
  }
}

async function testTavily(apiKey: string): Promise<TestResult> {
  try {
    const response = await testWithTimeout(
      fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: 'test',
          max_results: 1,
        }),
      })
    );

    if (response.status === 401 || response.status === 403) {
      return { success: false, message: 'Invalid API key. Please check your credentials.' };
    }
    if (response.status === 429) {
      return { success: false, message: 'Rate limit exceeded. Please try again later.' };
    }
    if (response.ok) {
      return { success: true, message: 'Connection successful. Tavily API is accessible.' };
    }

    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      message: errorData.message || `Connection failed with status ${response.status}`,
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'Connection timed out') {
      return { success: false, message: 'Connection timed out. Please try again.' };
    }
    return { success: false, message: 'Failed to connect to Tavily API.' };
  }
}

async function testBrowserbase(apiKey: string): Promise<TestResult> {
  try {
    const response = await testWithTimeout(
      fetch('https://www.browserbase.com/v1/sessions', {
        method: 'GET',
        headers: {
          'x-bb-api-key': apiKey,
        },
      })
    );

    if (response.status === 401 || response.status === 403) {
      return { success: false, message: 'Invalid API key. Please check your credentials.' };
    }
    if (response.ok) {
      return { success: true, message: 'Connection successful. Browserbase API is accessible.' };
    }

    return {
      success: false,
      message: `Connection failed with status ${response.status}`,
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'Connection timed out') {
      return { success: false, message: 'Connection timed out. Please try again.' };
    }
    return { success: false, message: 'Failed to connect to Browserbase API.' };
  }
}

async function testE2B(apiKey: string): Promise<TestResult> {
  try {
    const response = await testWithTimeout(
      fetch('https://api.e2b.dev/sandboxes', {
        method: 'GET',
        headers: {
          'X-E2B-Api-Key': apiKey,
        },
      })
    );

    if (response.status === 401 || response.status === 403) {
      return { success: false, message: 'Invalid API key. Please check your credentials.' };
    }
    if (response.ok) {
      return { success: true, message: 'Connection successful. E2B API is accessible.' };
    }

    return {
      success: false,
      message: `Connection failed with status ${response.status}`,
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'Connection timed out') {
      return { success: false, message: 'Connection timed out. Please try again.' };
    }
    return { success: false, message: 'Failed to connect to E2B API.' };
  }
}

async function testFirecrawl(apiKey: string): Promise<TestResult> {
  try {
    const response = await testWithTimeout(
      fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url: 'https://example.com',
          formats: ['markdown'],
        }),
      })
    );

    if (response.status === 401 || response.status === 403) {
      return { success: false, message: 'Invalid API key. Please check your credentials.' };
    }
    if (response.status === 429) {
      return { success: false, message: 'Rate limit exceeded. Please try again later.' };
    }
    if (response.ok || response.status === 402) {
      return { success: true, message: 'Connection successful. Firecrawl API is accessible.' };
    }

    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      message: errorData.message || `Connection failed with status ${response.status}`,
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'Connection timed out') {
      return { success: false, message: 'Connection timed out. Please try again.' };
    }
    return { success: false, message: 'Failed to connect to Firecrawl API.' };
  }
}

async function testPinecone(apiKey: string, environment?: string, indexName?: string): Promise<TestResult> {
  try {
    const response = await testWithTimeout(
      fetch('https://api.pinecone.io/indexes', {
        method: 'GET',
        headers: {
          'Api-Key': apiKey,
        },
      })
    );

    if (response.status === 401 || response.status === 403) {
      return { success: false, message: 'Invalid API key. Please check your credentials.' };
    }
    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      const indexes = data.indexes || [];
      const indexNames = indexes.map((i: { name: string }) => i.name);
      
      if (indexName && !indexNames.includes(indexName)) {
        return {
          success: true,
          message: `API key valid but index "${indexName}" not found. Available: ${indexNames.join(', ') || 'none'}`,
          details: { indexes: indexNames, indexExists: false },
        };
      }
      
      return {
        success: true,
        message: indexName 
          ? `Connection successful. Index "${indexName}" found.`
          : `Connection successful. Found ${indexes.length} index(es).`,
        details: { indexes: indexNames, indexExists: indexName ? true : undefined },
      };
    }

    return {
      success: false,
      message: `Connection failed with status ${response.status}`,
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'Connection timed out') {
      return { success: false, message: 'Connection timed out. Please try again.' };
    }
    return { success: false, message: 'Failed to connect to Pinecone API.' };
  }
}

async function testRedis(url: string, password?: string): Promise<TestResult> {
  try {
    const urlPattern = /^redis(s)?:\/\//i;
    const upstashPattern = /upstash\.io/i;
    
    if (!urlPattern.test(url)) {
      return {
        success: false,
        message: 'Invalid Redis URL format. URL should start with redis:// or rediss://',
      };
    }

    if (upstashPattern.test(url)) {
      try {
        const parsedUrl = new URL(url);
        const restUrl = `https://${parsedUrl.hostname}`;
        const token = parsedUrl.password || password;
        
        if (!token) {
          return {
            success: false,
            message: 'Upstash requires a password/token. Include it in the URL or provide separately.',
          };
        }
        
        const response = await testWithTimeout(
          fetch(`${restUrl}/ping`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }),
          5000
        );
        
        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          if (data.result === 'PONG') {
            return {
              success: true,
              message: 'Connection successful. Upstash Redis is accessible.',
              details: { provider: 'Upstash' },
            };
          }
        }
        
        if (response.status === 401) {
          return { success: false, message: 'Invalid Upstash credentials. Check your token.' };
        }
        
        return {
          success: true,
          message: 'Upstash URL format validated. Connection will be verified on first use.',
          details: { provider: 'Upstash', validated: 'format' },
        };
      } catch {
        return {
          success: true,
          message: 'Upstash URL format validated. Full connection test requires REST API access.',
          details: { provider: 'Upstash', validated: 'format' },
        };
      }
    }

    return {
      success: true,
      message: 'Redis URL format validated. Connection will be verified on first use.',
      details: { 
        note: 'Direct Redis TCP connections cannot be tested from edge functions.',
        validated: 'format',
      },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Invalid Redis URL. Please check the format.',
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { integrationType, credentials }: TestRequest = await req.json();

    if (!integrationType || !credentials) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing integration type or credentials',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let result: TestResult;

    switch (integrationType) {
      case 'anthropic':
        if (!credentials.apiKey) {
          result = { success: false, message: 'API key is required' };
        } else {
          result = await testAnthropic(credentials.apiKey);
        }
        break;

      case 'openai':
        if (!credentials.apiKey) {
          result = { success: false, message: 'API key is required' };
        } else {
          result = await testOpenAI(credentials.apiKey);
        }
        break;

      case 'huggingface':
        if (!credentials.token) {
          result = { success: false, message: 'API token is required' };
        } else {
          result = await testHuggingFace(credentials.token, credentials.endpoint);
        }
        break;

      case 'lmstudio':
        if (!credentials.url) {
          result = { success: false, message: 'Server URL is required' };
        } else {
          result = await testLocalServer(credentials.url);
        }
        break;

      case 'ollama':
        if (!credentials.url) {
          result = { success: false, message: 'Server URL is required' };
        } else {
          result = await testOllama(credentials.url);
        }
        break;

      case 'custom_llm':
        if (!credentials.baseUrl) {
          result = { success: false, message: 'Base URL is required' };
        } else {
          result = await testCustomLLM(credentials.baseUrl, credentials.apiKey);
        }
        break;

      case 'tavily':
        if (!credentials.apiKey) {
          result = { success: false, message: 'API key is required' };
        } else {
          result = await testTavily(credentials.apiKey);
        }
        break;

      case 'browserbase':
        if (!credentials.apiKey) {
          result = { success: false, message: 'API key is required' };
        } else {
          result = await testBrowserbase(credentials.apiKey);
        }
        break;

      case 'e2b':
        if (!credentials.apiKey) {
          result = { success: false, message: 'API key is required' };
        } else {
          result = await testE2B(credentials.apiKey);
        }
        break;

      case 'firecrawl':
        if (!credentials.apiKey) {
          result = { success: false, message: 'API key is required' };
        } else {
          result = await testFirecrawl(credentials.apiKey);
        }
        break;

      case 'pinecone':
        if (!credentials.apiKey) {
          result = { success: false, message: 'API key is required' };
        } else {
          result = await testPinecone(credentials.apiKey, credentials.environment, credentials.indexName);
        }
        break;

      case 'redis':
        if (!credentials.url) {
          result = { success: false, message: 'Connection URL is required' };
        } else {
          result = await testRedis(credentials.url, credentials.password);
        }
        break;

      default:
        result = {
          success: false,
          message: `Unknown integration type: ${integrationType}`,
        };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error testing integration:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'An unexpected error occurred while testing the connection',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});