export const reportError = (error, context = {}) => {
	try {
		// In a real setup, send to Sentry/LogRocket or your backend.
		// Keep minimal to avoid adding deps here.
		const payload = {
			message: error?.message || 'Unknown error',
			stack: error?.stack,
			...context,
			timestamp: new Date().toISOString(),
			url: typeof window !== 'undefined' ? window.location.href : undefined,
			userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
		};
		// Optionally POST to an internal endpoint:
		// fetch('/monitoring', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
		// Optionally POST to an internal endpoint:
		// fetch('/monitoring', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
	} catch (_) {
		// noop
	}
};
