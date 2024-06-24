import { webgpu_grid } from "./samples/grid/webgpu-grid.js";
import { webgpu_rectangle } from "./samples/rectangle/webgpu-rectangle.js";

export async function main(root_el: HTMLElement) {
    const default_sample_name = SampleName.Grid;
    const samples: Record<string, Sample> = getSamples();
    const [select_el, canvas] = createHTMLLayout(root_el, samples);

    let webgpu_instance: WebGPUInstance | null = null;
    let webgpu_support: boolean = false;

    try {
        webgpu_instance = await getWebGPUInstance(canvas);
        webgpu_support = true;
    } catch (e) {
        console.error(e);
    }

    if (webgpu_support) {
        await samples[default_sample_name].webgpu_sample(webgpu_instance!);
    } else {
        await samples[default_sample_name].webgl_sample();
    }

    select_el.addEventListener('change', async () => {
        const sample_name = select_el.value;
        const sample = samples[sample_name];

        if (!sample) {
            return;
        }

        if (webgpu_support && sample.webgpu_sample) {
            await sample.webgpu_sample(webgpu_instance!);
            return;
        }

        if (sample.webgl_sample) {
            await sample.webgl_sample();
        }
    });
}

async function getWebGPUInstance(canvas: HTMLCanvasElement): Promise<WebGPUInstance> {
    if (!navigator.gpu) {
        throw new Error('WebGPU is not supported in your browser');
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error('No adapter found');
    }

    const device = await adapter!.requestDevice();
    if (!device) {
        throw new Error('No device found');
    }

    const context = canvas!.getContext('webgpu')!;
    const format = navigator.gpu.getPreferredCanvasFormat();

    context.configure({ device, format });

    return {
        context,
        device,
        format
    };
}

function getSamples(): Record<string, Sample> {
    return {
        'grid': {
            description: 'Draws a grid of cells',
            webgpu_sample: webgpu_grid,
            webgl_sample: notImplemented
        },
        'rectangle': {
            description: 'Draws a rectangle',
            webgpu_sample: webgpu_rectangle,
            webgl_sample: notImplemented
        }
    };
}

function notImplemented(): Promise<void> {
    return Promise.reject(new Error('Not implemented'));
}

function createHTMLLayout(root_el: HTMLElement, samples: Record<SampleName, Sample>): [HTMLSelectElement, HTMLCanvasElement] {
    const el_width = root_el.clientWidth;
    const el_height = root_el.clientHeight;
    const select_el_height = 50;

    const select_el: HTMLSelectElement = createSampleSelectField(samples);
    select_el.style.width = `${el_width}px`;
    select_el.style.height = `${select_el_height}px`;

    const canvas: HTMLCanvasElement = document.createElement('canvas');
    canvas.width = el_width;
    canvas.height = el_height - select_el_height;

    root_el.appendChild(select_el);
    root_el.appendChild(canvas);

    return [select_el, canvas];
}

function createSampleSelectField(samples: Record<SampleName, Sample>): HTMLSelectElement {
    const el = document.createElement('select');
    const sample_names = Object.keys(samples) as SampleName[];

    for (let i = 0; i < sample_names.length; i++) {
        const option = document.createElement('option');
        option.value = sample_names[i];
        option.textContent = samples[sample_names[i]].description;
        el.appendChild(option);
    }

    return el;
}

enum SampleName {
    Grid = 'grid',
    Rectangle = 'rectangle'
}

interface Sample {
    description: string;
    webgpu_sample: (instance: WebGPUInstance) => Promise<void>;
    webgl_sample: () => Promise<void>;
}