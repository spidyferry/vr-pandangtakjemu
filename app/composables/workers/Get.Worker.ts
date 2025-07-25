export { };

interface WorkerRequest {
    url: string;
    payload: Record<string, string | number | boolean>;
}

interface WorkerResponse {
    success: boolean;
    data?: any;
    error?: string;
}

self.onmessage = async function (e: MessageEvent<WorkerRequest>) {
    const { url, payload } = e.data;

    const queryParams = new URLSearchParams(
        Object.entries(payload).reduce((acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
        }, {} as Record<string, string>)
    ).toString();

    const fullUrl = `${url}?${queryParams}`;

    try {
        const response = await fetch(fullUrl, {
            method: 'GET',
        });

        const contentType = response.headers.get('Content-Type') || '';
        const raw = await response.text();
        let parsed: any;
        try {
            if (contentType.includes('application/json')) {
                parsed = JSON.parse(raw);
            } else {
                const safeText = raw
                    .replace(/\\'/g, "'")
                    .replace(/'/g, '"')
                    .replace(/\bNone\b/g, 'null')
                    .replace(/\bTrue\b/g, 'true')
                    .replace(/\bFalse\b/g, 'false');
                parsed = JSON.parse(safeText);
            }
        } catch (jsonErr) {
            throw new Error(`Gagal parsing JSON: ${jsonErr instanceof Error ? jsonErr.message : 'Unknown error'}`);
        }

        self.postMessage({ success: true, data: parsed } satisfies WorkerResponse);
    } catch (error: any) {
        self.postMessage({ success: false, error: error.message } satisfies WorkerResponse);
    }
};
