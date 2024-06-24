export async function webgpu_rectangle(instance: WebGPUInstance): Promise<void> {
    const encoder = instance.device.createCommandEncoder();

    const pass = encoder.beginRenderPass({
        colorAttachments: [
            {
                view: instance.context.getCurrentTexture().createView(),
                loadOp: 'clear',
                clearValue: { r: 0.0, g: 0.0, b: 0.4, a: 1.0 },
                storeOp: 'store'
            }
        ]
    });

    const vertices = new Float32Array([
        -0.8, -0.8,
        0.8, -0.8,
        0.8, 0.8,

        -0.8, -0.8,
        0.8, 0.8,
        -0.8, 0.8
    ]);

    const vertexBuffer: GPUBuffer = instance.device.createBuffer({
        label: 'Cell vertices',
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    instance.device.queue.writeBuffer(vertexBuffer, 0, vertices);

    const vertexBufferLayout: GPUVertexBufferLayout = {
        arrayStride: 8,
        attributes: [
            {
                format: 'float32x2',
                offset: 0,
                shaderLocation: 0
            }
        ]
    };

    const cellShaderModule = instance.device.createShaderModule({
        label: 'Cell shader',
        code: `
            @vertex
            fn vertexMain(@location(0) pos: vec2f) -> @builtin(position) vec4f {
                return vec4f(pos.x, pos.y, 0, 1);
            }

            @fragment
            fn fragmentMain() -> @location(0) vec4f {
                return vec4f(1, 0, 0, 1);
            }
        `
    });

    const cellPipeline = instance.device.createRenderPipeline({
        label: 'Cell pipeline',
        layout: 'auto',
        vertex: {
            module: cellShaderModule,
            entryPoint: 'vertexMain',
            buffers: [vertexBufferLayout]
        },
        fragment: {
            module: cellShaderModule,
            entryPoint: 'fragmentMain',
            targets: [{
                format: instance.format
            }]
        },
    });

    pass.setPipeline(cellPipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.draw(vertices.length / 2);

    pass.end();

    instance.device.queue.submit([encoder.finish()]);
}