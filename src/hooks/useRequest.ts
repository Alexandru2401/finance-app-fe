import { useEffect, useState } from "react";

export interface RequestState<T> {
  // undefined while loading or after an error
  data: T | undefined;
  loading: boolean;
  error: boolean;
  // Sends the request again (e.g. the "Try again" button)
  retry: () => void;
}

/**
 * Loads data when `key` changes. `load` must be stable (useCallback with the
 * same inputs as the key); the result of an older request is ignored, so a
 * new key always shows loading first.
 */
export function useRequest<T>(
  key: string,
  load: () => Promise<T>,
): RequestState<T> {
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${key}#${attempt}`;
  const [result, setResult] = useState<{
    key: string;
    data?: T;
    error?: boolean;
  } | null>(null);

  useEffect(() => {
    let ignore = false;
    load()
      .then((data) => !ignore && setResult({ key: requestKey, data }))
      .catch(() => !ignore && setResult({ key: requestKey, error: true }));
    return () => {
      ignore = true;
    };
  }, [requestKey, load]);

  const loading = result?.key !== requestKey;
  return {
    data: loading ? undefined : result?.data,
    loading,
    error: !loading && result?.error === true,
    retry: () => setAttempt((n) => n + 1),
  };
}
