export async function webgpu_grid(instance: WebGPUInstance) {
    const GRID_SIZE = 4;

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

    const vertexBuffer = instance.device.createBuffer({
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
                @group(0) @binding(0) var<uniform> grid: vec2f;

                @vertex
                fn vertexMain(@location(0) pos: vec2f) -> @builtin(position) vec4f {
                    return vec4f(pos / grid, 0, 1);
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

    const uniformArray = new Float32Array([GRID_SIZE, GRID_SIZE]);
    const uniformBuffer = instance.device.createBuffer({
        label: 'Grid Uniforms',
        size: uniformArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    instance.device.queue.writeBuffer(uniformBuffer, 0, uniformArray);

    const bindGroup = instance.device.createBindGroup({
        label: 'Cell renderer bind group',
        layout: cellPipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: uniformBuffer
                }
            }
        ]
    });

    pass.setPipeline(cellPipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setBindGroup(0, bindGroup);
    pass.draw(vertices.length / 2);

    pass.end();

    instance.device.queue.submit([encoder.finish()]);
}