export class FetchError extends Error {
  info: any;
  status: number;
  constructor(message: string, info: any, status: number) {
    super(message);
    this.info = info;
    this.status = status;
    this.name = 'FetchError';
  }
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetcher = async <T>(
  url: string,
  options: {
    retries?: number;
    retryDelay?: number;
    timeout?: number;
  } = {}
): Promise<T> => {
  const {
    retries = 3,
    retryDelay = 1000,
    timeout = 5000
  } = options;

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        // Handle non-JSON responses
        const contentType = res.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          throw new FetchError(
            'Invalid response format: Expected JSON',
            { contentType, attempt },
            res.status
          );
        }

        const data = await res.json();

        if (!res.ok) {
          const errorMessage = data.error?.message || data.error || 'An error occurred while fetching the data';
          console.error(`API Error (${res.status}):`, {
            message: errorMessage,
            url,
            attempt,
            timestamp: new Date().toISOString(),
            status: res.status
          });
          
          throw new FetchError(
            errorMessage,
            { ...data, attempt },
            res.status
          );
        }

        // Handle empty responses for endpoints that should return data
        if (data === null || (Array.isArray(data) && data.length === 0)) {
          return data as T;
        }

        return data as T;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof FetchError && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === retries) {
        console.error('Fetch failed after retries:', {
          url,
          attempts: attempt + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        break;
      }

      // Wait before retrying
      await wait(retryDelay * Math.pow(2, attempt)); // Exponential backoff
    }
  }
  
  // If we get here, all retries failed
  const errorMessage = lastError instanceof Error ? lastError.message : 'Unknown error';
  throw new FetchError(
    'Failed to fetch data after multiple retries. Please check your connection and try again.',
    { message: errorMessage, attempts: retries + 1 },
    500
  );
};
