import React, { useEffect, useRef, useState } from 'react';

export default function FluidCursor() {
  const canvasRef = useRef(null);
  // Drives only the z-index below. Set once at mount, so the WebGL
  // effect's useEffect([]) never re-runs on the back of it.
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(pointer: coarse)').matches
    );
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const isCoarsePointer =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches;

    let config = {
      SIM_RESOLUTION: 128,
      DYE_RESOLUTION: 512,
      DENSITY_DISSIPATION: 0.97,
      VELOCITY_DISSIPATION: 0.98,
      PRESSURE_DISSIPATION: 0.8,
      PRESSURE_ITERATIONS: 20,
      CURL: 30,
      SPLAT_RADIUS: 0.1,
      SHADING: false,
      COLORFUL: false,
      PAUSED: false,
      BACK_COLOR: { r: 2, g: 3, b: 15 },
      TRANSPARENT: false,
      BLOOM: false,
    };

    /* Mobile-only quality profile.

       Mobile GPUs are tile-based deferred renderers (Adreno / Mali /
       PowerVR) and pay a full tile store+load on every render-target
       switch. The Jacobi pressure loop swaps FBOs once per iteration, so
       at 20 iterations it alone accounts for two thirds of the ~29 target
       switches this simulation performs every single frame. Desktop is an
       immediate-mode GPU and absorbs that for free — which is exactly why
       the effect lags on a phone and not on a laptop — so desktop keeps
       every original number and only coarse pointers are retuned.

       DYE_RESOLUTION is the other outlier: getResolution() scales by
       aspect ratio, so on a 390x844 phone the old 512 produced a
       512x1108 dye buffer against a 329k-pixel canvas — 1.7x more
       fragment work than the screen can display. 256 lands at ~256x554,
       comfortably under the canvas. */
    if (isCoarsePointer) {
      config.SIM_RESOLUTION = 96;
      config.DYE_RESOLUTION = 256;
      config.PRESSURE_ITERATIONS = 8;
    }

    function pointerPrototype() {
      this.id = -1;
      this.x = 0;
      this.y = 0;
      this.dx = 0;
      this.dy = 0;
      this.down = false;
      this.moved = false;
      this.color = [30, 0, 300];
    }

    let pointers = [new pointerPrototype()];
    let splatStack = [];
    let bloomFramebuffers = [];

    const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
    let gl = canvas.getContext('webgl2', params);
    const isWebGL2 = !!gl;
    if (!isWebGL2) gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);

    let halfFloat, supportLinearFiltering;
    if (isWebGL2) {
      gl.getExtension('EXT_color_buffer_float');
      supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
    } else {
      halfFloat = gl.getExtension('OES_texture_half_float');
      supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;

    function getSupportedFormat(gl, internalFormat, format, type) {
      if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
        switch (internalFormat) {
          case gl.R16F: return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
          case gl.RG16F: return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
          default: return null;
        }
      }
      return { internalFormat, format };
    }

    function supportRenderTextureFormat(gl, internalFormat, format, type) {
      let texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
      let fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      return gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    }

    let formatRGBA, formatRG, formatR;
    if (isWebGL2) {
      formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
      formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
      formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
    } else {
      formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
      formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
      formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
    }

    const ext = { formatRGBA, formatRG, formatR, halfFloatTexType, supportLinearFiltering };

    class GLProgram {
      constructor(vertexShader, fragmentShader) {
        this.uniforms = {};
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
          throw gl.getProgramInfoLog(this.program);
        const uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
          const uniformName = gl.getActiveUniform(this.program, i).name;
          this.uniforms[uniformName] = gl.getUniformLocation(this.program, uniformName);
        }
      }
      bind() { gl.useProgram(this.program); }
    }

    function compileShader(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(shader);
      return shader;
    }

    const baseVertexShader = compileShader(gl.VERTEX_SHADER, `
      precision highp float;
      attribute vec2 aPosition;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform vec2 texelSize;
      void main () {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `);

    const clearShader = compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      uniform sampler2D uTexture;
      uniform float value;
      void main () { gl_FragColor = value * texture2D(uTexture, vUv); }
    `);

    const colorShader = compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      uniform vec4 color;
      void main () { gl_FragColor = color; }
    `);

    const backgroundShader = compileShader(gl.FRAGMENT_SHADER, `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uTexture;
      uniform float aspectRatio;
      #define SCALE 25.0
      void main () {
        vec2 uv = floor(vUv * SCALE * vec2(aspectRatio, 1.0));
        float v = mod(uv.x + uv.y, 2.0);
        v = v * 0.1 + 0.8;
        gl_FragColor = vec4(vec3(v), 1.0);
      }
    `);

    const displayShader = compileShader(gl.FRAGMENT_SHADER, `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uTexture;
      void main () {
        vec3 C = texture2D(uTexture, vUv).rgb;
        float a = max(C.r, max(C.g, C.b));
        gl_FragColor = vec4(C, a);
      }
    `);

    const splatShader = compileShader(gl.FRAGMENT_SHADER, `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uTarget;
      uniform float aspectRatio;
      uniform vec3 color;
      uniform vec2 point;
      uniform float radius;
      void main () {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
      }
    `);

    const advectionManualFilteringShader = compileShader(gl.FRAGMENT_SHADER, `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform sampler2D uSource;
      uniform vec2 texelSize;
      uniform vec2 dyeTexelSize;
      uniform float dt;
      uniform float dissipation;
      vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
        vec2 st = uv / tsize - 0.5;
        vec2 iuv = floor(st);
        vec2 fuv = fract(st);
        vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
        vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
        vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
        vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
        return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
      }
      void main () {
        vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
        gl_FragColor = dissipation * bilerp(uSource, coord, dyeTexelSize);
        gl_FragColor.a = 1.0;
      }
    `);

    const advectionShader = compileShader(gl.FRAGMENT_SHADER, `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform sampler2D uSource;
      uniform vec2 texelSize;
      uniform float dt;
      uniform float dissipation;
      void main () {
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        gl_FragColor = dissipation * texture2D(uSource, coord);
        gl_FragColor.a = 1.0;
      }
    `);

    const divergenceShader = compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uVelocity;
      void main () {
        float L = texture2D(uVelocity, vL).x;
        float R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y;
        float B = texture2D(uVelocity, vB).y;
        vec2 C = texture2D(uVelocity, vUv).xy;
        if (vL.x < 0.0) { L = -C.x; }
        if (vR.x > 1.0) { R = -C.x; }
        if (vT.y > 1.0) { T = -C.y; }
        if (vB.y < 0.0) { B = -C.y; }
        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
      }
    `);

    const curlShader = compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uVelocity;
      void main () {
        float L = texture2D(uVelocity, vL).y;
        float R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x;
        float B = texture2D(uVelocity, vB).x;
        float vorticity = R - L - T + B;
        gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
      }
    `);

    const vorticityShader = compileShader(gl.FRAGMENT_SHADER, `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uVelocity;
      uniform sampler2D uCurl;
      uniform float curl;
      uniform float dt;
      void main () {
        float L = texture2D(uCurl, vL).x;
        float R = texture2D(uCurl, vR).x;
        float T = texture2D(uCurl, vT).x;
        float B = texture2D(uCurl, vB).x;
        float C = texture2D(uCurl, vUv).x;
        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        force /= length(force) + 0.0001;
        force *= curl * C;
        force.y *= -1.0;
        vec2 vel = texture2D(uVelocity, vUv).xy;
        gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
      }
    `);

    const pressureShader = compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uDivergence;
      void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        float divergence = texture2D(uDivergence, vUv).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
      }
    `);

    const gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uVelocity;
      void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `);

    // Setup blit quad
    const blit = (() => {
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(0);
      return (destination) => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      };
    })();

    let simWidth, simHeight, dyeWidth, dyeHeight;
    let density, velocity, divergence, curl, pressure;

    const clearProgram = new GLProgram(baseVertexShader, clearShader);
    const colorProgram = new GLProgram(baseVertexShader, colorShader);
    const backgroundProgram = new GLProgram(baseVertexShader, backgroundShader);
    const displayProgram = new GLProgram(baseVertexShader, displayShader);
    const splatProgram = new GLProgram(baseVertexShader, splatShader);
    const advectionProgram = new GLProgram(baseVertexShader, ext.supportLinearFiltering ? advectionShader : advectionManualFilteringShader);
    const divergenceProgram = new GLProgram(baseVertexShader, divergenceShader);
    const curlProgram = new GLProgram(baseVertexShader, curlShader);
    const vorticityProgram = new GLProgram(baseVertexShader, vorticityShader);
    const pressureProgram = new GLProgram(baseVertexShader, pressureShader);
    const gradienSubtractProgram = new GLProgram(baseVertexShader, gradientSubtractShader);

    function getResolution(resolution) {
      let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
      if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;
      let max = Math.round(resolution * aspectRatio);
      let min = Math.round(resolution);
      if (gl.drawingBufferWidth > gl.drawingBufferHeight) return { width: max, height: min };
      else return { width: min, height: max };
    }

    function createFBO(w, h, internalFormat, format, type, param) {
      gl.activeTexture(gl.TEXTURE0);
      let texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
      let fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return {
        texture, fbo, width: w, height: h,
        attach(id) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, texture); return id; }
      };
    }

    function createDoubleFBO(w, h, internalFormat, format, type, param) {
      let fbo1 = createFBO(w, h, internalFormat, format, type, param);
      let fbo2 = createFBO(w, h, internalFormat, format, type, param);
      return {
        get read() { return fbo1; }, set read(v) { fbo1 = v; },
        get write() { return fbo2; }, set write(v) { fbo2 = v; },
        swap() { let t = fbo1; fbo1 = fbo2; fbo2 = t; }
      };
    }

    function resizeFBO(target, w, h, internalFormat, format, type, param) {
      let newFBO = createFBO(w, h, internalFormat, format, type, param);
      clearProgram.bind();
      gl.uniform1i(clearProgram.uniforms.uTexture, target.attach(0));
      gl.uniform1f(clearProgram.uniforms.value, 1);
      blit(newFBO.fbo);
      return newFBO;
    }

    function resizeDoubleFBO(target, w, h, internalFormat, format, type, param) {
      target.read = resizeFBO(target.read, w, h, internalFormat, format, type, param);
      target.write = createFBO(w, h, internalFormat, format, type, param);
      return target;
    }

    function initFramebuffers() {
      let simRes = getResolution(config.SIM_RESOLUTION);
      let dyeRes = getResolution(config.DYE_RESOLUTION);
      simWidth = simRes.width; simHeight = simRes.height;
      dyeWidth = dyeRes.width; dyeHeight = dyeRes.height;

      const texType = ext.halfFloatTexType;
      const rgba = ext.formatRGBA;
      const rg = ext.formatRG;
      const r = ext.formatR;
      const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

      if (density == null) density = createDoubleFBO(dyeWidth, dyeHeight, rgba.internalFormat, rgba.format, texType, filtering);
      else density = resizeDoubleFBO(density, dyeWidth, dyeHeight, rgba.internalFormat, rgba.format, texType, filtering);

      if (velocity == null) velocity = createDoubleFBO(simWidth, simHeight, rg.internalFormat, rg.format, texType, filtering);
      else velocity = resizeDoubleFBO(velocity, simWidth, simHeight, rg.internalFormat, rg.format, texType, filtering);

      divergence = createFBO(simWidth, simHeight, r.internalFormat, r.format, texType, gl.NEAREST);
      curl = createFBO(simWidth, simHeight, r.internalFormat, r.format, texType, gl.NEAREST);
      pressure = createDoubleFBO(simWidth, simHeight, r.internalFormat, r.format, texType, gl.NEAREST);
    }

    function generateColor() {
      return { r: 150 / 255, g: 150 / 255, b: 150 / 255 };
    }

    function splat(x, y, dx, dy, color) {
      gl.viewport(0, 0, simWidth, simHeight);
      splatProgram.bind();
      gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
      gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
      gl.uniform2f(splatProgram.uniforms.point, x / canvas.width, 1.0 - y / canvas.height);
      gl.uniform3f(splatProgram.uniforms.color, dx, -dy, 1.0);
      gl.uniform1f(splatProgram.uniforms.radius, config.SPLAT_RADIUS / 100.0);
      blit(velocity.write.fbo);
      velocity.swap();

      gl.viewport(0, 0, dyeWidth, dyeHeight);
      gl.uniform1i(splatProgram.uniforms.uTarget, density.read.attach(0));
      gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
      blit(density.write.fbo);
      density.swap();
    }

    function multipleSplats(amount) {
      for (let i = 0; i < amount; i++) {
        const color = generateColor();
        color.r *= 6.0; color.g *= 6.0; color.b *= 6.0;
        const x = canvas.width * Math.random();
        const y = canvas.height * Math.random();
        const dx = 1000 * (Math.random() - 0.5);
        const dy = 1000 * (Math.random() - 0.5);
        splat(x, y, dx, dy, color);
      }
    }

    function step(dt) {
      gl.disable(gl.BLEND);
      gl.viewport(0, 0, simWidth, simHeight);

      curlProgram.bind();
      gl.uniform2f(curlProgram.uniforms.texelSize, 1.0 / simWidth, 1.0 / simHeight);
      gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(curl.fbo);

      vorticityProgram.bind();
      gl.uniform2f(vorticityProgram.uniforms.texelSize, 1.0 / simWidth, 1.0 / simHeight);
      gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
      gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
      gl.uniform1f(vorticityProgram.uniforms.dt, dt);
      blit(velocity.write.fbo);
      velocity.swap();

      divergenceProgram.bind();
      gl.uniform2f(divergenceProgram.uniforms.texelSize, 1.0 / simWidth, 1.0 / simHeight);
      gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(divergence.fbo);

      clearProgram.bind();
      gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
      gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE_DISSIPATION);
      blit(pressure.write.fbo);
      pressure.swap();

      pressureProgram.bind();
      gl.uniform2f(pressureProgram.uniforms.texelSize, 1.0 / simWidth, 1.0 / simHeight);
      gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
      for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
        blit(pressure.write.fbo);
        pressure.swap();
      }

      gradienSubtractProgram.bind();
      gl.uniform2f(gradienSubtractProgram.uniforms.texelSize, 1.0 / simWidth, 1.0 / simHeight);
      gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
      gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
      blit(velocity.write.fbo);
      velocity.swap();

      advectionProgram.bind();
      gl.uniform2f(advectionProgram.uniforms.texelSize, 1.0 / simWidth, 1.0 / simHeight);
      if (!ext.supportLinearFiltering)
        gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, 1.0 / simWidth, 1.0 / simHeight);
      let velocityId = velocity.read.attach(0);
      gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
      gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
      gl.uniform1f(advectionProgram.uniforms.dt, dt);
      gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
      blit(velocity.write.fbo);
      velocity.swap();

      gl.viewport(0, 0, dyeWidth, dyeHeight);
      if (!ext.supportLinearFiltering)
        gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, 1.0 / dyeWidth, 1.0 / dyeHeight);
      gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(advectionProgram.uniforms.uSource, density.read.attach(1));
      gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
      blit(density.write.fbo);
      density.swap();
    }

    function render(target) {
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);

      let width = target == null ? gl.drawingBufferWidth : dyeWidth;
      let height = target == null ? gl.drawingBufferHeight : dyeHeight;
      gl.viewport(0, 0, width, height);

      colorProgram.bind();
      let bc = config.BACK_COLOR;
      gl.uniform4f(colorProgram.uniforms.color, bc.r / 255, bc.g / 255, bc.b / 255, 1);
      blit(target);

      displayProgram.bind();
      gl.uniform1i(displayProgram.uniforms.uTexture, density.read.attach(0));
      blit(target);
    }

    function resizeCanvas() {
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        initFramebuffers();
      }
    }

    /* Mobile replacement for calling resizeCanvas() from the frame loop.

       Two problems with doing it per frame on a phone: reading
       clientWidth/clientHeight forces a style+layout flush 60x a second,
       and when the viewport height does shift — URL-bar collapse,
       orientation change, keyboard — initFramebuffers() reallocates 12
       textures and 12 framebuffers in the middle of the scroll. Debouncing
       collapses the burst of resize events a URL-bar animation emits into
       one reallocation after the gesture has settled. resizeCanvas() keeps
       its own "did anything actually change" guard, so a spurious resize
       still costs nothing. */
    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { resizeCanvas(); wake(); }, 150);
    };

    /* Reduced motion on touch devices: never render a frame at all.

       Scoped to coarse pointers on purpose — `freeze` is always false on
       desktop, so the desktop effect keeps behaving exactly as it does
       today, reduced-motion or not. With no render call the canvas simply
       stays transparent, and the rAF loop never starts, which is real
       battery saved rather than an invisible animation. */
    const freeze =
      isCoarsePointer &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    initFramebuffers();
    if (!freeze) multipleSplats(parseInt(Math.random() * 20) + 5);

    let rafId = null;
    let idleFrames = 0;

    /* DENSITY_DISSIPATION is 0.97 per frame, so 0.97^150 ~= 0.01: after
       150 idle frames the dye is visually gone and there is nothing left
       to integrate. Past that point the loop stops scheduling frames
       instead of burning ~29 render-target switches on an invisible
       simulation — which on a phone is the difference between the GPU
       being busy permanently and being busy only while you touch it.
       Applied to coarse pointers only; desktop never sleeps. */
    const IDLE_FRAMES = 150;

    function update() {
      // Desktop keeps its per-frame resize check exactly as it was. Mobile
      // uses the debounced resize listener below instead, so the frame loop
      // never forces a style/layout flush.
      if (!isCoarsePointer) resizeCanvas();
      if (splatStack.length > 0) multipleSplats(splatStack.pop());

      let active = false;
      for (let i = 0; i < pointers.length; i++) {
        const p = pointers[i];
        if (p.moved) { splat(p.x, p.y, p.dx, p.dy, p.color); p.moved = false; active = true; }
      }
      idleFrames = active ? 0 : idleFrames + 1;

      if (!config.PAUSED) step(0.016);
      render(null);

      /* Sleeping is visually seamless: render() always blits BACK_COLOR
         first, so the frozen canvas is the same faint dark film it shows
         while idle today. Nothing pops on sleep or on wake. */
      if (isCoarsePointer && idleFrames > IDLE_FRAMES) { rafId = null; return; }
      rafId = requestAnimationFrame(update);
    }

    // Every mobile input path calls this; it is a no-op while the loop is
    // already running, so it is safe to call on every touch event.
    function wake() {
      if (rafId == null && !freeze) {
        idleFrames = 0;
        rafId = requestAnimationFrame(update);
      }
    }

    if (!freeze) update();

    const onMouseMove = (e) => {
      pointers[0].moved = pointers[0].down;
      pointers[0].dx = (e.clientX - pointers[0].x) * 5.0;
      pointers[0].dy = (e.clientY - pointers[0].y) * 5.0;
      pointers[0].x = e.clientX;
      pointers[0].y = e.clientY;
      pointers[0].down = true;
      pointers[0].color = generateColor();
    };

    // Shared by the desktop and touch paths so both feed the simulation
    // through identical maths — same 5.0 velocity scale, so a finger drag
    // and a mouse drag produce the same trail.
    //
    // `color` is a parameter purely so the mobile path can hand over the
    // shared POINTER_COLOR constant instead of allocating a fresh object
    // on every touchmove. generateColor() is a constant function, so the
    // values fed to splat() are identical either way.
    const applyTouch = (t, color) => {
      pointers[0].moved = pointers[0].down;
      pointers[0].dx = (t.clientX - pointers[0].x) * 5.0;
      pointers[0].dy = (t.clientY - pointers[0].y) * 5.0;
      pointers[0].x = t.clientX;
      pointers[0].y = t.clientY;
      pointers[0].down = true;
      pointers[0].color = color;
    };

    const onTouchMove = (e) => {
      e.preventDefault();
      applyTouch(e.touches[0], generateColor());
    };

    /* Coarse-pointer devices get their own listeners.

       The handler above cannot be reused on a phone: its preventDefault()
       kills native scrolling, which is why it was historically left
       unattached here and the effect stayed inert on mobile. The three
       handlers below never call preventDefault and are all registered
       passive, so the browser never blocks on them — scrolling, taps,
       links, the mobile Hero's swipe and every carousel behave exactly as
       if these listeners did not exist.

       Fine-pointer touchscreens (a Windows laptop with a touch display)
       deliberately keep the old preventDefault path — that is existing
       desktop behaviour and is not ours to change here. */
    /* Scrolling always wins.

       While the page is scrolling we stop feeding the simulation, so a
       scroll frame costs the fluid nothing and the compositor keeps the
       whole frame budget. The listener is passive and does no work beyond
       setting a flag, so it never delays or blocks the gesture. */
    let scrolling = false;
    let scrollTimer;
    const onScroll = () => {
      scrolling = true;
      pointers[0].moved = false; // drop any splat queued for this frame
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => { scrolling = false; }, 150);
    };

    /* Which finger owns the trail.

       Without this, `touches[0]` silently re-binds to a different finger
       the moment the first one lifts, and the next dx/dy is measured
       across the gap between two fingers — a single enormous splat. That
       is the sudden-jump / duplicate-trail glitch. Extra fingers are
       ignored rather than fought over. */
    let activeTouchId = null;

    // The one splat-per-touchmove colour. generateColor() returns this
    // same constant, so this only removes an allocation per event.
    const POINTER_COLOR = { r: 150 / 255, g: 150 / 255, b: 150 / 255 };

    const onTouchStartMobile = (e) => {
      if (activeTouchId !== null) return; // already tracking a finger
      const t = e.changedTouches[0];
      activeTouchId = t.identifier;
      pointers[0].x = t.clientX;
      pointers[0].y = t.clientY;
      // Zero velocity: drops dye exactly under the finger instead of
      // streaking in from wherever the pointer was left last time.
      pointers[0].dx = 0;
      pointers[0].dy = 0;
      pointers[0].down = true;
      pointers[0].color = POINTER_COLOR;
      // Grabbing a scrolling page to arrest its momentum must not paint.
      // The position above is still seeded, so if the grab turns into a
      // real drag it starts from the right place with no velocity spike.
      if (scrolling) return;
      pointers[0].moved = true;
      wake();
    };

    const findActive = (list) => {
      for (let i = 0; i < list.length; i++) {
        if (list[i].identifier === activeTouchId) return list[i];
      }
      return null;
    };

    const onTouchMoveMobile = (e) => {
      if (activeTouchId === null) return;
      const t = findActive(e.changedTouches);
      if (t == null) return; // a second finger moved — not ours
      if (scrolling) {
        /* Keep the tracked position current but never queue a splat: no
           GPU work during the scroll, and no velocity spike when the
           scroll settles and the same drag continues. */
        pointers[0].x = t.clientX;
        pointers[0].y = t.clientY;
        pointers[0].dx = 0;
        pointers[0].dy = 0;
        return;
      }
      applyTouch(t, POINTER_COLOR);
      wake();
    };

    // Stop feeding splats. DENSITY_DISSIPATION (0.97) then fades the trail
    // out on the existing timing — no extra animation code needed. Only
    // releases when the finger that *owns* the trail is the one lifting,
    // so a second finger going up mid-drag changes nothing.
    const onTouchEndMobile = (e) => {
      if (activeTouchId === null || findActive(e.changedTouches) == null) return;
      activeTouchId = null;
      pointers[0].down = false;
      pointers[0].moved = false;
    };

    document.body.addEventListener('mousemove', onMouseMove);
    // The nesting matters: a frozen coarse pointer must attach NOTHING.
    // Flattening this into `if (isCoarsePointer && !freeze) … else …` sends
    // reduced-motion phones into the desktop branch, whose preventDefault
    // would block scrolling — the exact failure the comment above warns of.
    if (isCoarsePointer) {
      if (!freeze) {
        document.body.addEventListener('touchstart', onTouchStartMobile, { passive: true });
        document.body.addEventListener('touchmove', onTouchMoveMobile, { passive: true });
        document.body.addEventListener('touchend', onTouchEndMobile, { passive: true });
        document.body.addEventListener('touchcancel', onTouchEndMobile, { passive: true });
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);
        window.addEventListener('orientationchange', onResize);
      }
    } else {
      document.body.addEventListener('touchmove', onTouchMove, { passive: false });
    }

    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      document.body.removeEventListener('mousemove', onMouseMove);
      if (isCoarsePointer) {
        if (!freeze) {
          clearTimeout(scrollTimer);
          clearTimeout(resizeTimer);
          document.body.removeEventListener('touchstart', onTouchStartMobile);
          document.body.removeEventListener('touchmove', onTouchMoveMobile);
          document.body.removeEventListener('touchend', onTouchEndMobile);
          document.body.removeEventListener('touchcancel', onTouchEndMobile);
          window.removeEventListener('scroll', onScroll);
          window.removeEventListener('resize', onResize);
          window.removeEventListener('orientationchange', onResize);
        }
      } else {
        document.body.removeEventListener('touchmove', onTouchMove);
      }
      // React StrictMode double-invokes effects in dev; without an explicit
      // release the discarded context leaks and browsers cap how many a
      // page may hold.
      const lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        /* Desktop keeps 9999 — untouched. On touch devices the effect
           drops below the intentionally-stacked UI: dock (40), modal
           (50), mobile menu (60), toasts (100), while still sitting
           above the page background and every section. */
        zIndex: isTouch ? 30 : 9999,
        opacity: 0.15,
      }}
    />
  );
}