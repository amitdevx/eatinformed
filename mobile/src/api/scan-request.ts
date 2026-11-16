interface Failure {
  response?: { status?: number; data?: { code?: string; error?: string; requestId?: string } };
}

// A pending duplicate is a status check on the same operation, not a new scan.
export async function awaitScanResponse<T>(
  send: (remainingMs: number) => Promise<T>,
  options: { now?: () => number; sleep?: (ms: number) => Promise<void>; budgetMs?: number } = {},
): Promise<T> {
  const now = options.now || Date.now;
  const sleep = options.sleep || ((ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)));
  const deadline = now() + (options.budgetMs ?? 90000);
  let networkFailures = 0;
  for (;;) {
    try { return await send(Math.max(1, deadline - now())); }
    catch (error) {
      const failure = error as Failure;
      const status = failure.response?.status;
      const pending = status === 409 && failure.response?.data?.code === 'scan_in_progress';
      const transport = !status || status === 408;
      if ((!pending && (!transport || ++networkFailures > 2)) || now() + 1500 >= deadline) throw error;
      await sleep(1500);
    }
  }
}
