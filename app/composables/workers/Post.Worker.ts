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

    try {
        console.log("[Worker] Payload:", JSON.stringify(payload));

        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        console.log(response);
        const raw = await response.text();
        console.log(raw);
        // const contentType = response.headers.get('Content-Type') || '';

        // let parsed: any;
        // if (contentType.includes('application/json')) {
        //     parsed = await response.json();
        // } else {
        //     parsed = await response.text();
        // }

        // console.log('[Worker] Parsed response:', parsed);

        // self.postMessage({ success: response.ok, data: parsed, error: !response.ok ? `HTTP ${response.status}` : undefined } satisfies WorkerResponse);

    } catch (error: any) {
        self.postMessage({ success: false, error: error.message } satisfies WorkerResponse);
    }
};
