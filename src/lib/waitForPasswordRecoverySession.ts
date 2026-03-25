import type { SupabaseClient } from '@supabase/supabase-js';

export type PasswordRecoverySessionResult = 'ready' | 'invalid' | 'aborted';

const RECOVERY_WAIT_MS = 2000;

/**
 * After a reset email link, Supabase may establish the session on the next tick
 * or via URL hash handling. We try getSession immediately, subscribe for a
 * short window, then re-check getSession before treating the link as expired.
 */
export async function waitForPasswordRecoverySession(
  client: SupabaseClient,
  signal: AbortSignal
): Promise<PasswordRecoverySessionResult> {
  if (signal.aborted) {
    return 'aborted';
  }

  const hasSession = async (): Promise<boolean> => {
    const {
      data: { session },
    } = await client.auth.getSession();
    return session !== null;
  };

  if (await hasSession()) {
    return 'ready';
  }
  if (signal.aborted) {
    return 'aborted';
  }

  return new Promise<PasswordRecoverySessionResult>((resolve) => {
    let settled = false;

    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession) {
        finish('ready');
      }
    });
    const { subscription } = data;

    function finish(result: PasswordRecoverySessionResult): void {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
      resolve(result);
    }

    const timeoutId = setTimeout(async () => {
      if (signal.aborted) {
        return;
      }
      if (await hasSession()) {
        finish('ready');
      } else if (!signal.aborted) {
        finish('invalid');
      }
    }, RECOVERY_WAIT_MS);

    signal.addEventListener('abort', () => finish('aborted'), { once: true });
  });
}
