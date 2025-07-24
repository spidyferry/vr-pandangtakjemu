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
        console.log(JSON.stringify(payload))
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        console.log(response);
        //self.postMessage({ success: true, data: parsed } satisfies WorkerResponse);
    } catch (error: any) {
        self.postMessage({ success: false, error: error.message } satisfies WorkerResponse);
    }
};
