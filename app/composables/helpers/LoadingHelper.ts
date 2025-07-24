import type { LoadingManager } from "three";

export class LoadingHelper {
    public readonly loadingManager: LoadingManager | null = null;

    private _progress: number = 0;
    private _text: string = 'Loading Assets';

    constructor({
        loadingManager,
        loadingContainer,
        progressHtml,
        textHtml
    }: {
        loadingManager: LoadingManager,
        loadingContainer: HTMLElement,
        progressHtml: HTMLElement,
        textHtml: HTMLElement
    }) {
        this.loadingManager = loadingManager;

        this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
            if (loadingContainer) loadingContainer.style.display = 'flex';
            if (textHtml) textHtml.innerHTML = this._text;
        };

        this.loadingManager.onLoad = () => {
            if (this._progress >= 1) {
                setTimeout(() => {
                    if (loadingContainer) {
                        textHtml.innerHTML = `Preparing your experience...`;
                        setTimeout(() => {
                            loadingContainer.style.display = 'none';
                        }, 500);
                    }
                }, 1000);
            }
        };

        this.loadingManager.onProgress = (url: string, itemsLoaded: number, itemsTotal: number) => {
            this._progress = itemsLoaded / itemsTotal;

            if (progressHtml) {
                progressHtml.style.width = `${this._progress * 100}%`;
            }

            if (textHtml) {
                const path = this._safePath(url);
                const fileExtension = path.split('.').pop()?.toLowerCase() ?? '';
                const hasExtension = /\.[a-z]{2,4}($|\?)/i.test(path);

                if (path.includes('/hdr/') || fileExtension === 'hdr') {
                    textHtml.innerHTML = `Loading Environment...`;
                } else if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExtension)) {
                    textHtml.innerHTML = `Loading Image...`;
                } else if (!hasExtension) {
                    if (path.includes('/products')) {
                        textHtml.innerHTML = `Fetching Products...`;
                    } else {
                        textHtml.innerHTML = `Fetching Data...`;
                    }
                } else {
                    textHtml.innerHTML = `Loading: ${path}`;
                }
            }
        };

        this.loadingManager.onError = (url: string) => {
            this._text = `Failed to load: ${url}`;
            if (textHtml) {
                textHtml.innerHTML = this._text;
            }
        };
    }

    private _safePath(url: string): string {
        try {
            return new URL(url).pathname;
        } catch {
            return url;
        }
    }
}
