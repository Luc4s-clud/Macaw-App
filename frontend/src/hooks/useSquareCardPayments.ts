import { useCallback, useEffect, useRef, useState } from 'react';
import {
  isSquarePaymentsConfigured,
  squareApplicationId,
  squareLocationId,
  squarePaymentsEnv,
} from '../config/env';

const SQUARE_SCRIPT = {
  sandbox: 'https://sandbox.web.squarecdn.com/v1/square.js',
  production: 'https://web.squarecdn.com/v1/square.js',
} as const;

type SquareCardHandler = {
  attach: (selector: string | HTMLElement) => Promise<void>;
  destroy: () => Promise<void>;
  tokenize: () => Promise<{
    status: string;
    token?: string;
    errors?: { message: string }[];
  }>;
};

type SquarePaymentsApi = {
  card: () => Promise<SquareCardHandler>;
};

type SquareNamespace = {
  payments: (
    applicationId: string,
    locationId: string
  ) => SquarePaymentsApi | Promise<SquarePaymentsApi>;
};

declare global {
  interface Window {
    Square?: SquareNamespace;
  }
}

function loadSquareScript(): Promise<SquareNamespace> {
  if (window.Square) {
    return Promise.resolve(window.Square);
  }
  const url = SQUARE_SCRIPT[squarePaymentsEnv()];
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = url;
    s.async = true;
    s.onload = () => {
      if (window.Square) resolve(window.Square);
      else reject(new Error('Square SDK not available after load.'));
    };
    s.onerror = () =>
      reject(new Error('Could not load Square Web Payments SDK.'));
    document.head.appendChild(s);
  });
}

async function getPaymentsApi(
  Sq: SquareNamespace,
  appId: string,
  locId: string
): Promise<SquarePaymentsApi> {
  const raw = Sq.payments(appId, locId);
  return raw && typeof (raw as Promise<SquarePaymentsApi>).then === 'function'
    ? await (raw as Promise<SquarePaymentsApi>)
    : raw;
}

/**
 * Carrega o Web Payments SDK, anexa o formulário de cartão ao container e expõe tokenize().
 */
export function useSquareCardPayments() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<SquareCardHandler | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const configured = isSquarePaymentsConfigured();

  useEffect(() => {
    if (!configured) return;

    let cancelled = false;

    (async () => {
      try {
        const Sq = await loadSquareScript();
        if (cancelled) return;
        const el = containerRef.current;
        if (!el) {
          setLoadError('Card container not available.');
          return;
        }
        const appId = squareApplicationId();
        const locId = squareLocationId();
        const payments = await getPaymentsApi(Sq, appId, locId);
        const card = await payments.card();
        await card.attach(el);
        if (cancelled) {
          await card.destroy().catch(() => {});
          return;
        }
        cardRef.current = card;
        setLoadError(null);
        setReady(true);
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            e instanceof Error ? e.message : 'Could not load card form.'
          );
          setReady(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      const c = cardRef.current;
      cardRef.current = null;
      setReady(false);
      if (c) {
        c.destroy().catch(() => {});
      }
    };
  }, [configured]);

  const tokenize = useCallback(async (): Promise<string> => {
    const card = cardRef.current;
    if (!card) {
      throw new Error('Card form is not ready yet.');
    }
    const result = await card.tokenize();
    if (result.status !== 'OK' || !result.token) {
      const msg =
        result.errors?.map((x) => x.message).join(' ') ||
        'Card could not be verified. Check the details.';
      throw new Error(msg);
    }
    return result.token;
  }, []);

  return { containerRef, ready, loadError, tokenize, configured };
}
