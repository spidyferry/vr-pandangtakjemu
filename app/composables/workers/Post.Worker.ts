export { };

interface WorkerRequest {
    url: string;
    payload: Record<string, any>;
}

interface WorkerResponse {
    success: boolean;
    data?: any;
    error?: string;
}

self.onmessage = async function (e: MessageEvent<WorkerRequest>) {
    const { url, payload } = e.data;

    // Ubah payload jadi form-urlencoded
    const body = new URLSearchParams(
        Object.entries(payload).reduce((acc, [key, val]) => {
            acc[key] = String(val);
            return acc;
        }, {} as Record<string, string>)
    ).toString();

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body,
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
