/**
 * Audio-Reactive Heatmap Shader - Framer Component (Self-Contained)
 * Based on Paper Design's heatmap shader
 * Responds to voice audio from ElevenLabs via CustomEvent
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

import * as React from "react"
import { motion } from "framer-motion"

// ============================================
// Heatmap Fragment Shader (from Paper Shaders)
// ============================================

const MAX_COLOR_COUNT = 10

const heatmapFragmentShader = `#version 300 es
precision highp float;

in mediump vec2 v_imageUV;
in mediump vec2 v_objectUV;
out vec4 fragColor;

uniform sampler2D u_image;
uniform float u_time;
uniform mediump float u_imageAspectRatio;

uniform vec4 u_colorBack;
uniform vec4 u_colors[${MAX_COLOR_COUNT}];
uniform float u_colorsCount;

uniform float u_angle;
uniform float u_noise;
uniform float u_innerGlow;
uniform float u_outerGlow;
uniform float u_contour;

#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

float getImgFrame(vec2 uv, float th) {
  float frame = 1.;
  frame *= smoothstep(0., th, uv.y);
  frame *= 1. - smoothstep(1. - th, 1., uv.y);
  frame *= smoothstep(0., th, uv.x);
  frame *= 1. - smoothstep(1. - th, 1., uv.x);
  return frame;
}

float circle(vec2 uv, vec2 c, vec2 r) {
  return 1. - smoothstep(r[0], r[1], length(uv - c));
}

float lst(float edge0, float edge1, float x) {
  return clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
}

float sst(float edge0, float edge1, float x) {
  return smoothstep(edge0, edge1, x);
}

float shadowShape(vec2 uv, float t, float contour) {
  vec2 scaledUV = uv;
  float posY = mix(-1., 2., t);
  scaledUV.y -= .5;
  float mainCircleScale = sst(0., .8, posY) * lst(1.4, .9, posY);
  scaledUV *= vec2(1., 1. + 1.5 * mainCircleScale);
  scaledUV.y += .5;
  float innerR = .4;
  float outerR = 1. - .3 * (sst(.1, .2, t) * (1. - sst(.2, .5, t)));
  float s = circle(scaledUV, vec2(.5, posY - .2), vec2(innerR, outerR));
  float shapeSizing = sst(.2, .3, t) * sst(.6, .3, t);
  s = pow(s, 1.4);
  s *= 1.2;
  float topFlattener = 0.;
  {
    float pos = posY - uv.y;
    float edge = 1.2;
    topFlattener = lst(-.4, 0., pos) * (1. - sst(.0, edge, pos));
    topFlattener = pow(topFlattener, 3.);
    float topFlattenerMixer = (1. - sst(.0, .3, pos));
    s = mix(topFlattener, s, topFlattenerMixer);
  }
  {
    float visibility = sst(.6, .7, t) * (1. - sst(.8, .9, t));
    float angle = -2. -t * TWO_PI;
    float rightCircle = circle(uv, vec2(.95 - .2 * cos(angle), .4 - .1 * sin(angle)), vec2(.15, .3));
    rightCircle *= visibility;
    s = mix(s, 0., rightCircle);
  }
  {
    float topCircle = circle(uv, vec2(.5, .19), vec2(.05, .25));
    topCircle += 2. * contour * circle(uv, vec2(.5, .19), vec2(.2, .5));
    float visibility = .55 * sst(.2, .3, t) * (1. - sst(.3, .45, t));
    topCircle *= visibility;
    s = mix(s, 0., topCircle);
  }
  float leafMask = circle(uv, vec2(.53, .13), vec2(.08, .19));
  leafMask = mix(leafMask, 0., 1. - sst(.4, .54, uv.x));
  leafMask = mix(0., leafMask, sst(.0, .2, uv.y));
  leafMask *= (sst(.5, 1.1, posY) * sst(1.5, 1.3, posY));
  s += leafMask;
  {
    float visibility = sst(.0, .4, t) * (1. - sst(.6, .8, t));
    s = mix(s, 0., visibility * circle(uv, vec2(.52, .92), vec2(.09, .25)));
  }
  {
    float pos = sst(.0, .6, t) * (1. - sst(.6, 1., t));
    s = mix(s, .5, circle(uv, vec2(.0, 1.2 - .5 * pos), vec2(.1, .3)));
    s = mix(s, .0, circle(uv, vec2(1., .5 + .5 * pos), vec2(.1, .3)));
    s = mix(s, 1., circle(uv, vec2(.95, .2 + .2 * sst(.3, .4, t) * sst(.7, .5, t)), vec2(.07, .22)));
    s = mix(s, 1., circle(uv, vec2(.95, .2 + .2 * sst(.3, .4, t) * (1. - sst(.5, .7, t))), vec2(.07, .22)));
    s /= max(1e-4, sst(1., .85, uv.y));
  }
  s = clamp(0., 1., s);
  return s;
}

float blurEdge3x3(sampler2D tex, vec2 uv, vec2 dudx, vec2 dudy, float radius, float centerSample) {
  vec2 texel = 1.0 / vec2(textureSize(tex, 0));
  vec2 r = radius * texel;
  float w1 = 1.0, w2 = 2.0, w4 = 4.0;
  float norm = 16.0;
  float sum = w4 * centerSample;
  sum += w2 * textureGrad(tex, uv + vec2(0.0, -r.y), dudx, dudy).g;
  sum += w2 * textureGrad(tex, uv + vec2(0.0, r.y), dudx, dudy).g;
  sum += w2 * textureGrad(tex, uv + vec2(-r.x, 0.0), dudx, dudy).g;
  sum += w2 * textureGrad(tex, uv + vec2(r.x, 0.0), dudx, dudy).g;
  sum += w1 * textureGrad(tex, uv + vec2(-r.x, -r.y), dudx, dudy).g;
  sum += w1 * textureGrad(tex, uv + vec2(r.x, -r.y), dudx, dudy).g;
  sum += w1 * textureGrad(tex, uv + vec2(-r.x, r.y), dudx, dudy).g;
  sum += w1 * textureGrad(tex, uv + vec2(r.x, r.y), dudx, dudy).g;
  return sum / norm;
}

void main() {
  vec2 uv = v_objectUV + .5;
  uv.y = 1. - uv.y;
  vec2 imgUV = v_imageUV;
  imgUV -= .5;
  imgUV *= 0.5; // Adjust crop to be tighter to image
  imgUV += .5;
  float imgSoftFrame = getImgFrame(imgUV, .03);
  vec4 img = texture(u_image, imgUV);
  vec2 dudx = dFdx(imgUV);
  vec2 dudy = dFdy(imgUV);
  if (img.a == 0.) {
    fragColor = u_colorBack;
    return;
  }
  float t = .1 * u_time;
  t -= .3;
  float tCopy = t + 1. / 3.;
  float tCopy2 = t + 2. / 3.;
  t = mod(t, 1.);
  tCopy = mod(tCopy, 1.);
  tCopy2 = mod(tCopy2, 1.);
  vec2 animationUV = imgUV - vec2(.5);
  float angle = -u_angle * PI / 180.;
  float cosA = cos(angle);
  float sinA = sin(angle);
  animationUV = vec2(
    animationUV.x * cosA - animationUV.y * sinA,
    animationUV.x * sinA + animationUV.y * cosA
  ) + vec2(.5);
  float shape = img[0];
  img[1] = blurEdge3x3(u_image, imgUV, dudx, dudy, 8., img[1]);
  float outerBlur = 1. - mix(1., img[1], shape);
  float innerBlur = mix(img[1], 0., shape);
  float contour = mix(img[2], 0., shape);
  outerBlur *= imgSoftFrame;
  float shadow = shadowShape(animationUV, t, innerBlur);
  float shadowCopy = shadowShape(animationUV, tCopy, innerBlur);
  float shadowCopy2 = shadowShape(animationUV, tCopy2, innerBlur);
  float inner = .8 + .8 * innerBlur;
  inner = mix(inner, 0., shadow);
  inner = mix(inner, 0., shadowCopy);
  inner = mix(inner, 0., shadowCopy2);
  inner *= mix(0., 2., u_innerGlow);
  inner += (u_contour * 2.) * contour;
  inner = min(1., inner);
  inner *= (1. - shape);
  float outer = 0.;
  {
    t *= 3.;
    t = mod(t - .1, 1.);
    outer = .9 * pow(outerBlur, .8);
    float y = mod(animationUV.y - t, 1.);
    float animatedMask = sst(.3, .65, y) * (1. - sst(.65, 1., y));
    animatedMask = .5 + animatedMask;
    outer *= animatedMask;
    outer *= mix(0., 5., pow(u_outerGlow, 2.));
    outer *= imgSoftFrame;
  }
  inner = pow(inner, 1.2);
  float heat = clamp(inner + outer, 0., 1.);
  heat += (.005 + .35 * u_noise) * (fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453123) - .5);
  float mixer = heat * u_colorsCount;
  vec4 gradient = u_colors[0];
  gradient.rgb *= gradient.a;
  float outerShape = 0.;
  for (int i = 1; i < ${MAX_COLOR_COUNT + 1}; i++) {
    if (i > int(u_colorsCount)) break;
    float m = clamp(mixer - float(i - 1), 0., 1.);
    if (i == 1) {
      outerShape = m;
    }
    vec4 c = u_colors[i - 1];
    c.rgb *= c.a;
    gradient = mix(gradient, c, m);
  }
  vec3 color = gradient.rgb * outerShape;
  float opacity = gradient.a * outerShape;
  vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
  color = color + bgColor * (1.0 - opacity);
  opacity = opacity + u_colorBack.a * (1.0 - opacity);
  color += .02 * (fract(sin(dot(uv + 1., vec2(12.9898, 78.233))) * 43758.5453123) - .5);
  fragColor = vec4(color, opacity);
}
`

// ============================================
// Image Processing for Heatmap
// ============================================

function blurGray(
    gray: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number
): Uint8ClampedArray {
    if (radius <= 0) return gray.slice()

    const out = new Uint8ClampedArray(width * height)
    const integral = new Uint32Array(width * height)

    for (let y = 0; y < height; y++) {
        let rowSum = 0
        for (let x = 0; x < width; x++) {
            const idx = y * width + x
            const v = gray[idx] ?? 0
            rowSum += v
            integral[idx] = rowSum + (y > 0 ? (integral[idx - width] ?? 0) : 0)
        }
    }

    for (let y = 0; y < height; y++) {
        const y1 = Math.max(0, y - radius)
        const y2 = Math.min(height - 1, y + radius)
        for (let x = 0; x < width; x++) {
            const x1 = Math.max(0, x - radius)
            const x2 = Math.min(width - 1, x + radius)
            const idxA = y2 * width + x2
            const idxB = y2 * width + (x1 - 1)
            const idxC = (y1 - 1) * width + x2
            const idxD = (y1 - 1) * width + (x1 - 1)
            const A = integral[idxA] ?? 0
            const B = x1 > 0 ? (integral[idxB] ?? 0) : 0
            const C = y1 > 0 ? (integral[idxC] ?? 0) : 0
            const D = x1 > 0 && y1 > 0 ? (integral[idxD] ?? 0) : 0
            const sum = A - B - C + D
            const area = (x2 - x1 + 1) * (y2 - y1 + 1)
            out[y * width + x] = Math.round(sum / area)
        }
    }
    return out
}

function multiPassBlurGray(
    gray: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number,
    passes: number
): Uint8ClampedArray {
    if (radius <= 0 || passes <= 1) {
        return blurGray(gray, width, height, radius)
    }
    let input = gray
    let tmp = gray
    for (let p = 0; p < passes; p++) {
        tmp = blurGray(input, width, height, radius)
        input = tmp
    }
    return tmp
}

async function toProcessedHeatmap(file: string): Promise<{ blob: Blob }> {
    const canvas = document.createElement("canvas")
    const canvasSize = 1000

    return new Promise((resolve, reject) => {
        const image = new Image()
        image.crossOrigin = "anonymous"

        image.addEventListener("load", () => {
            // Check if SVG - handle Framer CDN URLs that may contain svg in path
            const isSvg = file.endsWith(".svg") || file.toLowerCase().includes("svg") || file.includes(".svg")
            if (isSvg) {
                image.width = canvasSize
                image.height = canvasSize
            }

            const naturalWidth = image.naturalWidth || image.width || canvasSize
            const naturalHeight = image.naturalHeight || image.height || canvasSize
            const ratio = naturalWidth / naturalHeight
            const maxBlur = Math.floor(canvasSize * 0.15)
            const padding = Math.ceil(maxBlur * 2.5)

            let imgWidth = canvasSize
            let imgHeight = canvasSize
            if (ratio > 1) {
                imgHeight = Math.floor(canvasSize / ratio)
            } else {
                imgWidth = Math.floor(canvasSize * ratio)
            }

            canvas.width = imgWidth + 2 * padding
            canvas.height = imgHeight + 2 * padding

            const ctx = canvas.getContext("2d", { willReadFrequently: true })
            if (!ctx) {
                reject(new Error("Failed to get canvas 2d context"))
                return
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(image, padding, padding, imgWidth, imgHeight)

            const { width, height } = canvas
            const srcImageData = ctx.getImageData(0, 0, width, height)
            const src = srcImageData.data
            const totalPixels = width * height

            const gray = new Uint8ClampedArray(totalPixels)
            for (let i = 0; i < totalPixels; i++) {
                const px = i * 4
                const r = src[px] ?? 0
                const g = src[px + 1] ?? 0
                const b = src[px + 2] ?? 0
                const a = src[px + 3] ?? 0
                const lum = 0.299 * r + 0.587 * g + 0.114 * b
                const alpha = a / 255
                const compositeLum = lum * alpha + 255 * (1 - alpha)
                gray[i] = Math.round(compositeLum)
            }

            const bigBlurRadius = maxBlur
            const innerBlurRadius = Math.max(1, Math.round(0.12 * maxBlur))
            const contourRadius = 5

            const bigBlurGray = multiPassBlurGray(
                gray,
                width,
                height,
                bigBlurRadius,
                3
            )
            const innerBlurGray = multiPassBlurGray(
                gray,
                width,
                height,
                innerBlurRadius,
                3
            )
            const contourGray = multiPassBlurGray(
                gray,
                width,
                height,
                contourRadius,
                1
            )

            const processedImageData = ctx.createImageData(width, height)
            const dst = processedImageData.data

            for (let i = 0; i < totalPixels; i++) {
                const px = i * 4
                dst[px] = contourGray[i] ?? 0
                dst[px + 1] = bigBlurGray[i] ?? 0
                dst[px + 2] = innerBlurGray[i] ?? 0
                dst[px + 3] = 255
            }

            ctx.putImageData(processedImageData, 0, 0)

            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error("Failed to create PNG blob"))
                    return
                }
                resolve({ blob })
            }, "image/png")
        })

        image.addEventListener("error", () => {
            reject(new Error("Failed to load image"))
        })

        image.src = file
    })
}

// ============================================
// Vertex Shader
// ============================================

const vertexShaderSource = `#version 300 es
precision mediump float;

layout(location = 0) in vec4 a_position;

uniform vec2 u_resolution;
uniform float u_pixelRatio;
uniform float u_imageAspectRatio;

uniform float u_originX;
uniform float u_originY;
uniform float u_worldWidth;
uniform float u_worldHeight;
uniform float u_fit;

uniform float u_scale;
uniform float u_rotation;
uniform float u_offsetX;
uniform float u_offsetY;

out vec2 v_objectUV;
out vec2 v_imageUV;

void main() {
    gl_Position = a_position;

    vec2 uv = gl_Position.xy * 0.5;
    vec2 boxOrigin = vec2(0.5 - u_originX, u_originY - 0.5);
    
    float r = u_rotation * 3.14159265358979323846 / 180.0;
    mat2 graphicRotation = mat2(cos(r), sin(r), -sin(r), cos(r));
    vec2 graphicOffset = vec2(-u_offsetX, u_offsetY);

    v_objectUV = uv;
    v_objectUV += graphicOffset;
    v_objectUV /= u_scale;
    v_objectUV = graphicRotation * v_objectUV;

    // Calculate canvas aspect ratio
    float canvasAspectRatio = u_resolution.x / u_resolution.y;
    
    vec2 imageBoxSize;
    if (u_fit == 1.0) {
        // CONTAIN: fit entire image inside canvas, maintain aspect ratio
        if (u_imageAspectRatio > canvasAspectRatio) {
            // Image is wider than canvas
            imageBoxSize.x = u_resolution.x;
            imageBoxSize.y = u_resolution.x / u_imageAspectRatio;
        } else {
            // Image is taller than canvas
            imageBoxSize.y = u_resolution.y;
            imageBoxSize.x = u_resolution.y * u_imageAspectRatio;
        }
    } else if (u_fit == 2.0) {
        // COVER: fill canvas, crop image if needed, maintain aspect ratio
        if (u_imageAspectRatio > canvasAspectRatio) {
            // Image is wider than canvas
            imageBoxSize.y = u_resolution.y;
            imageBoxSize.x = u_resolution.y * u_imageAspectRatio;
        } else {
            // Image is taller than canvas
            imageBoxSize.x = u_resolution.x;
            imageBoxSize.y = u_resolution.x / u_imageAspectRatio;
        }
    } else {
        // FILL: stretch to fill canvas (no aspect ratio preservation)
        imageBoxSize = u_resolution;
    }
    vec2 imageBoxScale = u_resolution.xy / imageBoxSize;

    v_imageUV = uv;
    v_imageUV *= imageBoxScale;
    v_imageUV += boxOrigin * (imageBoxScale - 1.0);
    v_imageUV += graphicOffset;
    v_imageUV /= u_scale;
    v_imageUV.x *= u_imageAspectRatio;
    v_imageUV = graphicRotation * v_imageUV;
    v_imageUV.x /= u_imageAspectRatio;

    v_imageUV += 0.5;
    v_imageUV.y = 1.0 - v_imageUV.y;
}`

// ============================================
// Shader Mount Class
// ============================================

class HeatmapShaderMount {
    private parentElement: HTMLElement
    private canvasElement: HTMLCanvasElement
    private gl: WebGL2RenderingContext
    private program: WebGLProgram | null = null
    private uniformLocations: Record<string, WebGLUniformLocation | null> = {}
    private rafId: number | null = null
    private lastRenderTime = 0
    private currentFrame = 0
    private speed = 1
    private hasBeenDisposed = false
    private textures: Map<string, WebGLTexture> = new Map()
    private textureUnitMap: Map<string, number> = new Map()

    constructor(parentElement: HTMLElement, isCanvas = false) {
        this.parentElement = parentElement

        const canvasElement = document.createElement("canvas")
        this.canvasElement = canvasElement
        this.parentElement.prepend(canvasElement)

        canvasElement.style.position = "absolute"
        canvasElement.style.top = "50%"
        canvasElement.style.left = "50%"
        canvasElement.style.transform = "translate(-50%, -50%)"
        canvasElement.style.aspectRatio = "1 / 1"
        canvasElement.style.width = "100%"
        canvasElement.style.height = "auto"
        canvasElement.style.maxWidth = "100%"
        canvasElement.style.maxHeight = "100%"
        canvasElement.style.objectFit = "contain"
        canvasElement.style.backgroundColor = "transparent"

        // Ensure parent is also transparent
        this.parentElement.style.background = "transparent"

        // In canvas mode (Framer preview), show immediately at full opacity
        // In preview mode, use fade-in animation
        if (isCanvas) {
            canvasElement.style.opacity = "1"
        } else {
            canvasElement.style.opacity = "0"
            canvasElement.style.transition =
                "opacity 0.8s cubic-bezier(0.33, 1, 0.68, 1)"

            // Trigger fade-in after a delay to layer with container animation
            setTimeout(() => {
                canvasElement.style.opacity = "1"
            }, 200)
        }

        // Add WebGL context loss handling
        canvasElement.addEventListener("webglcontextlost", (event) => {
            event.preventDefault()
            console.warn("[HeatmapShader] WebGL context lost")
            this.stop()
        })

        canvasElement.addEventListener("webglcontextrestored", () => {
            console.log("[HeatmapShader] WebGL context restored")
            this.initProgram()
            this.setupPositionAttribute()
            this.setupUniforms()
            this.start()
        })

        const gl = canvasElement.getContext("webgl2", {
            alpha: true,
            antialias: true,
            premultipliedAlpha: true,
            preserveDrawingBuffer: false,
            powerPreference: "high-performance",
        })

        if (!gl) {
            console.error("[HeatmapShader] WebGL2 not supported")
            throw new Error(
                "WebGL2 is not supported. Please use a modern browser."
            )
        }

        console.log("[HeatmapShader] WebGL2 context created successfully")
        this.gl = gl

        // Set default clear color to transparent (will be updated when uniforms are set)
        gl.clearColor(0, 0, 0, 0)

        // Enable blending for proper transparency
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

        this.initProgram()
        this.setupPositionAttribute()
        this.setupUniforms()
        this.setupResizeObserver()
    }

    private initProgram() {
        const gl = this.gl

        console.log("[HeatmapShader] Compiling vertex shader...")
        const vertexShader = gl.createShader(gl.VERTEX_SHADER)
        if (!vertexShader) {
            console.error("[HeatmapShader] Failed to create vertex shader")
            return
        }
        gl.shaderSource(vertexShader, vertexShaderSource)
        gl.compileShader(vertexShader)

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(vertexShader)
            console.error(
                "[HeatmapShader] Vertex shader compilation error:",
                error
            )
            throw new Error(`Vertex shader error: ${error}`)
        }

        console.log("[HeatmapShader] Compiling fragment shader...")
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
        if (!fragmentShader) {
            console.error("[HeatmapShader] Failed to create fragment shader")
            return
        }
        gl.shaderSource(fragmentShader, heatmapFragmentShader)
        gl.compileShader(fragmentShader)

        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(fragmentShader)
            console.error(
                "[HeatmapShader] Fragment shader compilation error:",
                error
            )
            throw new Error(`Fragment shader error: ${error}`)
        }

        console.log("[HeatmapShader] Linking shader program...")
        const program = gl.createProgram()
        if (!program) {
            console.error("[HeatmapShader] Failed to create program")
            return
        }
        gl.attachShader(program, vertexShader)
        gl.attachShader(program, fragmentShader)
        gl.linkProgram(program)

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const error = gl.getProgramInfoLog(program)
            console.error("[HeatmapShader] Program link error:", error)
            throw new Error(`Program link error: ${error}`)
        }

        console.log(
            "[HeatmapShader] Shader program compiled and linked successfully"
        )
        this.program = program

        gl.detachShader(program, vertexShader)
        gl.detachShader(program, fragmentShader)
        gl.deleteShader(vertexShader)
        gl.deleteShader(fragmentShader)
    }

    private setupPositionAttribute() {
        const gl = this.gl
        const positionAttributeLocation = gl.getAttribLocation(
            this.program!,
            "a_position"
        )
        const positionBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

        const positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(positions),
            gl.STATIC_DRAW
        )
        gl.enableVertexAttribArray(positionAttributeLocation)
        gl.vertexAttribPointer(
            positionAttributeLocation,
            2,
            gl.FLOAT,
            false,
            0,
            0
        )
    }

    private setupUniforms() {
        const gl = this.gl
        if (!this.program) return

        const uniformNames = [
            "u_time",
            "u_resolution",
            "u_pixelRatio",
            "u_imageAspectRatio",
            "u_originX",
            "u_originY",
            "u_worldWidth",
            "u_worldHeight",
            "u_fit",
            "u_scale",
            "u_rotation",
            "u_offsetX",
            "u_offsetY",
            "u_image",
            "u_colorBack",
            "u_colors",
            "u_colorsCount",
            "u_angle",
            "u_noise",
            "u_innerGlow",
            "u_outerGlow",
            "u_contour",
        ]

        for (const name of uniformNames) {
            this.uniformLocations[name] = gl.getUniformLocation(
                this.program,
                name
            )
        }
    }

    private resizeObserver: ResizeObserver | null = null

    private setupResizeObserver() {
        this.resizeObserver = new ResizeObserver(([entry]) => {
            if (entry) {
                this.handleResize(
                    entry.contentRect.width,
                    entry.contentRect.height
                )
            }
        })
        this.resizeObserver.observe(this.parentElement)
    }

    private handleResize(width: number, height: number) {
        const dpr = Math.min(window.devicePixelRatio, 2)

        // Maintain 1:1 aspect ratio for square heatmap
        const canvasAspectRatio = 1
        let canvasWidth = Math.min(width, height)
        let canvasHeight = canvasWidth

        // If calculated height exceeds container height, scale based on height instead
        if (canvasHeight > height) {
            canvasHeight = height
            canvasWidth = height * canvasAspectRatio
        }

        const w = Math.round(canvasWidth * dpr)
        const h = Math.round(canvasHeight * dpr)

        if (this.canvasElement.width !== w || this.canvasElement.height !== h) {
            this.canvasElement.width = w
            this.canvasElement.height = h
            this.gl.viewport(0, 0, w, h)
        }

        this.gl.useProgram(this.program)
        // Use actual canvas dimensions for resolution
        this.gl.uniform2f(this.uniformLocations.u_resolution!, w, h)
        this.gl.uniform1f(this.uniformLocations.u_pixelRatio!, dpr)
        this.render(performance.now())
    }

    setTextureUniform(uniformName: string, image: HTMLImageElement) {
        const gl = this.gl

        if (!this.textureUnitMap.has(uniformName)) {
            this.textureUnitMap.set(uniformName, this.textureUnitMap.size)
        }
        const textureUnit = this.textureUnitMap.get(uniformName)!
        gl.activeTexture(gl.TEXTURE0 + textureUnit)

        const existingTexture = this.textures.get(uniformName)
        if (existingTexture) {
            gl.deleteTexture(existingTexture)
        }

        const texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_MIN_FILTER,
            gl.LINEAR_MIPMAP_LINEAR
        )
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        )
        gl.generateMipmap(gl.TEXTURE_2D)

        this.textures.set(uniformName, texture!)

        const location = this.uniformLocations[uniformName]
        if (location) {
            gl.uniform1i(location, textureUnit)
        }

        const aspectRatio = image.naturalWidth / image.naturalHeight
        const aspectLocation = this.uniformLocations.u_imageAspectRatio
        if (aspectLocation) {
            gl.uniform1f(aspectLocation, aspectRatio)
        }
    }

    setUniformValues(uniforms: Record<string, any>) {
        const gl = this.gl
        gl.useProgram(this.program)

        for (const [key, value] of Object.entries(uniforms)) {
            if (value === undefined) continue

            const location = this.uniformLocations[key]
            if (!location) continue

            if (value instanceof HTMLImageElement) {
                this.setTextureUniform(key, value)
            } else if (Array.isArray(value)) {
                if (value.length > 0 && Array.isArray(value[0])) {
                    const flat = value.flat()
                    gl.uniform4fv(location, flat)
                } else if (value.length === 4) {
                    gl.uniform4fv(location, value)
                    // Don't update clearColor - keep canvas transparent so container background shows through

                } else if (value.length === 2) {
                    gl.uniform2fv(location, value)
                }
            } else if (typeof value === "number") {
                gl.uniform1f(location, value)
            }
        }
    }

    render = (currentTime: number) => {
        if (this.hasBeenDisposed) return
        if (!this.program) return

        const dt = currentTime - this.lastRenderTime
        this.lastRenderTime = currentTime
        this.currentFrame += dt * this.speed

        const gl = this.gl
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.useProgram(this.program)
        gl.uniform1f(this.uniformLocations.u_time!, this.currentFrame * 0.001)
        gl.drawArrays(gl.TRIANGLES, 0, 6)

        this.rafId = requestAnimationFrame(this.render)
    }

    setSpeed(speed: number) {
        this.speed = speed
    }

    start() {
        if (this.rafId === null) {
            this.lastRenderTime = performance.now()
            this.rafId = requestAnimationFrame(this.render)
        }
    }

    stop() {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId)
            this.rafId = null
        }
    }

    dispose() {
        this.hasBeenDisposed = true
        this.stop()
        this.resizeObserver?.disconnect()
        this.textures.forEach((texture) => this.gl.deleteTexture(texture))
        if (this.gl && this.program) {
            this.gl.deleteProgram(this.program)
        }
        this.canvasElement.remove()
    }
}

// ============================================
// Color Helper
// ============================================

function hexToVec4(hex: string): [number, number, number, number] {
    // Handle rgba() format
    const rgbaMatch =
        /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/i.exec(hex)
    if (rgbaMatch) {
        return [
            parseInt(rgbaMatch[1], 10) / 255,
            parseInt(rgbaMatch[2], 10) / 255,
            parseInt(rgbaMatch[3], 10) / 255,
            rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1.0,
        ]
    }

    // Handle 8-digit hex (RGBA)
    const rgba8 = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
        hex
    )
    if (rgba8) {
        return [
            parseInt(rgba8[1], 16) / 255,
            parseInt(rgba8[2], 16) / 255,
            parseInt(rgba8[3], 16) / 255,
            parseInt(rgba8[4], 16) / 255,
        ]
    }

    // Handle 6-digit hex (RGB)
    const rgb6 = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (rgb6) {
        return [
            parseInt(rgb6[1], 16) / 255,
            parseInt(rgb6[2], 16) / 255,
            parseInt(rgb6[3], 16) / 255,
            1.0,
        ]
    }

    // Handle 3-digit hex shorthand
    const rgb3 = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex)
    if (rgb3) {
        return [
            parseInt(rgb3[1] + rgb3[1], 16) / 255,
            parseInt(rgb3[2] + rgb3[2], 16) / 255,
            parseInt(rgb3[3] + rgb3[3], 16) / 255,
            1.0,
        ]
    }

    console.warn("[HeatmapShader] Invalid color format:", hex, "using black")
    return [0, 0, 0, 1]
}

// ============================================
// Types
// ============================================

interface AudioHeatmapProps {
    image?: string
    colors?: string[]
    colorBack?: string
    contour?: number
    innerGlow?: number
    outerGlow?: number
    noise?: number
    angle?: number
    speed?: number
    scale?: number
    fit?: "contain" | "cover" | "fill"
    audioReactivity?: number
    bassToInnerGlow?: number
    midToOuterGlow?: number
    trebleToContour?: number
    volumeToAngle?: number
    getVolume?: () => number
    width?: number
    height?: number
    isDesignMode?: boolean
    style?: React.CSSProperties
    // className?: string
}

export default function AudioHeatmap({
    // getVolume,
    image = "https://framerusercontent.com/images/33s7K51323Jz9622k6dKk3yV2s.png",
    colors = ["#11206A", "#1F3BA2", "#2F63E7", "#6BD7FF", "#FFE679", "#FF991E", "#FF4C00"],
    colorBack = "#0d1117",
    scale = 0.6,
    speed = 0.4,
    angle = 30,
    noise = 0,
    innerGlow = 0.3,
    outerGlow = 0.5,
    contour = 0.6,
    fit = "cover",
    style,
    // width,
    // height,
    audioReactivity = 1.2,
    volumeToAngle = 30,
    bassToInnerGlow = 0.5,
    midToOuterGlow = 0.8,
    trebleToContour = 0.3,
    isDesignMode = false,
}: AudioHeatmapProps) {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const shaderRef = React.useRef<HeatmapShaderMount | null>(null)
    const [processedImage, setProcessedImage] = React.useState<HTMLImageElement | null>(null)
    const [isMounted, setIsMounted] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    // Alias for compatibility with existing logic
    const isCanvas = isDesignMode

    // SSR guard - only run on client
    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    // Audio state from ElevenLabs
    const [audioData, setAudioData] = React.useState({
        bass: 0,
        mid: 0,
        treble: 0,
        volume: 0,
    })

    // Track if agent is talking based on volume threshold
    const [isTalking, setIsTalking] = React.useState(false)
    const [shouldScale, setShouldScale] = React.useState(false)
    const scaleDownTimerRef = React.useRef<number | null>(null)

    // Listen for audio data from ElevenLabs component via CustomEvent
    React.useEffect(() => {
        if (typeof window === "undefined") return

        const handleAudioData = (event: CustomEvent) => {
            const detail = event.detail

            // Handle new array format (from BarVisualizer update)
            if (detail.volume && Array.isArray(detail.volume)) {
                const bands = detail.volume as number[]
                const len = bands.length

                // Calculate average volume
                const avgVolume = bands.reduce((sum, v) => sum + v, 0) / len

                // Split into 3 ranges for bass/mid/treble
                const third = Math.floor(len / 3)

                let bass = 0,
                    mid = 0,
                    treble = 0

                if (len > 0) {
                    // Simple average for each third
                    const bassBands = bands.slice(0, third || 1)
                    const midBands = bands.slice(third || 1, (third * 2) || 2)
                    const trebleBands = bands.slice((third * 2) || 2)

                    bass =
                        bassBands.reduce((s, v) => s + v, 0) /
                        (bassBands.length || 1)
                    mid =
                        midBands.reduce((s, v) => s + v, 0) /
                        (midBands.length || 1)
                    treble =
                        trebleBands.reduce((s, v) => s + v, 0) /
                        (trebleBands.length || 1)
                }

                setAudioData({
                    bass,
                    mid,
                    treble,
                    volume: avgVolume,
                })

                setIsTalking(avgVolume > 0.05)
                return
            }

            // Handle legacy object format
            if (
                typeof detail.volume === "number" &&
                typeof detail.bass === "number"
            ) {
                setAudioData({
                    bass: detail.bass,
                    mid: detail.mid,
                    treble: detail.treble,
                    volume: detail.volume,
                })
                setIsTalking(detail.volume > 0.05)
            }
        }

        window.addEventListener(
            "elevenlabs-audio-data",
            handleAudioData as EventListener
        )
        return () => {
            window.removeEventListener(
                "elevenlabs-audio-data",
                handleAudioData as EventListener
            )
        }
    }, [])

    // Handle delayed scale down when agent stops talking
    React.useEffect(() => {
        if (isTalking) {
            // Agent is talking - immediately scale up and cancel any pending scale down
            if (scaleDownTimerRef.current) {
                clearTimeout(scaleDownTimerRef.current)
                scaleDownTimerRef.current = null
            }
            setShouldScale(true)
        } else {
            // Agent stopped talking - wait 2 seconds before scaling down
            scaleDownTimerRef.current = window.setTimeout(() => {
                setShouldScale(false)
            }, 1000)
        }

        return () => {
            if (scaleDownTimerRef.current) {
                clearTimeout(scaleDownTimerRef.current)
            }
        }
    }, [isTalking])

    // Process the image for heatmap effect
    React.useEffect(() => {
        // SSR guard
        if (typeof window === "undefined" || typeof document === "undefined")
            return
        if (!isMounted) return

        let cancelled = false
        setError(null)

        // Generate default image if none provided
        let imageUrl = ""
        if (!image) {
            console.log(
                "[AudioHeatmap] No image provided, generating default base..."
            )
            const canvas = document.createElement("canvas")
            canvas.width = 512
            canvas.height = 512
            const ctx = canvas.getContext("2d")
            if (ctx) {
                // Clear
                ctx.clearRect(0, 0, 512, 512)

                // Draw white circle with soft edge
                const cx = 256
                const cy = 256
                const radius = 200

                // Create radial gradient for soft edge
                const grad = ctx.createRadialGradient(
                    cx,
                    cy,
                    radius * 0.5,
                    cx,
                    cy,
                    radius
                )
                grad.addColorStop(0, "rgba(255, 255, 255, 1)")
                grad.addColorStop(0.8, "rgba(255, 255, 255, 0.8)")
                grad.addColorStop(1, "rgba(255, 255, 255, 0)")

                ctx.fillStyle = grad
                ctx.beginPath()
                ctx.arc(cx, cy, radius, 0, Math.PI * 2)
                ctx.fill()

                imageUrl = canvas.toDataURL("image/png")
            }
        } else {
            // Resolve Framer image URL if needed
            imageUrl =
                typeof image === "string" ? image : (image as any)?.src || image
        }

        console.log("[AudioHeatmap] Processing image source...")

        toProcessedHeatmap(imageUrl)
            .then((result) => {
                if (cancelled) return

                const url = URL.createObjectURL(result.blob)
                const img = new Image()
                img.crossOrigin = "anonymous"

                img.onload = () => {
                    if (!cancelled) {
                        console.log(
                            "[AudioHeatmap] Image processed successfully"
                        )
                        setProcessedImage(img)
                    }
                }

                img.onerror = (e) => {
                    console.error(
                        "[AudioHeatmap] Failed to load processed image:",
                        e
                    )
                    setError("Failed to load processed image")
                }

                img.src = url
            })
            .catch((err) => {
                console.error(
                    "[AudioHeatmap] Failed to process heatmap image:",
                    err
                )
                setError(`Failed to process image: ${err.message}`)
            })

        return () => {
            cancelled = true
        }
    }, [image, isMounted])

    // Initialize shader when processed image is ready
    React.useEffect(() => {
        // SSR guard
        if (typeof window === "undefined") return
        if (!isMounted) return

        const container = containerRef.current
        if (!container || !processedImage) return

        try {
            console.log(
                "[AudioHeatmap] Initializing shader...",
                isCanvas ? "(Canvas mode)" : "(Preview mode)"
            )
            const shader = new HeatmapShaderMount(container, isCanvas)
            shaderRef.current = shader
            shader.setSpeed(speed)

            return () => {
                shader.dispose()
            }
        } catch (err: any) {
            console.error("[AudioHeatmap] Failed to initialize shader:", err)
            setError(`Shader error: ${err.message}`)
        }
    }, [processedImage, isMounted, isCanvas, speed])

    // Update uniforms when props or audio data change
    React.useEffect(() => {
        const shader = shaderRef.current
        if (!shader || !processedImage) return

        // Audio-reactive values (disabled on Canvas for static preview)
        const audioMultiplier = isCanvas ? 0 : 1
        const dynamicInnerGlow =
            innerGlow +
            audioData.bass * audioReactivity * bassToInnerGlow * audioMultiplier
        const dynamicOuterGlow =
            outerGlow +
            audioData.volume *
            audioReactivity *
            midToOuterGlow *
            audioMultiplier +
            audioData.mid * audioReactivity * 0.5 * audioMultiplier
        const dynamicContour =
            contour +
            audioData.treble *
            audioReactivity *
            trebleToContour *
            audioMultiplier
        const dynamicAngle =
            angle +
            audioData.volume * audioReactivity * volumeToAngle * audioMultiplier

        if (!isCanvas) {
            shader.setSpeed(
                speed * (1 + audioData.volume * audioReactivity * 0.5)
            )
        }

        // Debug: log background color from Framer


        // Convert fit string to shader value
        const fitValue = fit === "contain" ? 1 : fit === "cover" ? 2 : 0

        shader.setUniformValues({
            u_image: processedImage,
            u_contour: Math.min(1, dynamicContour),
            u_angle: dynamicAngle,
            u_noise: noise,
            u_innerGlow: Math.min(1, dynamicInnerGlow),
            u_outerGlow: Math.min(1, dynamicOuterGlow),
            u_colorBack: hexToVec4(colorBack),
            u_colors: colors.map(hexToVec4),
            u_colorsCount: colors.length,

            // Sizing
            u_fit: fitValue,
            u_offsetX: 0,
            u_offsetY: 0,
            u_originX: 0.5,
            u_originY: 0.5,
            u_rotation: 0,
            u_scale: scale,
            u_worldWidth: 0,
            u_worldHeight: 0,
        })

        // Start animation in Preview mode after uniforms are set
        if (!isCanvas) {
            shader.start()
            console.log("[AudioHeatmap] Shader animation started (Preview) after uniforms set")
        } else {
            // Update static frame on Canvas when props change
            shader.render(performance.now())
            console.log("[AudioHeatmap] Shader static frame rendered (Canvas)")
        }
    }, [
        processedImage,
        colors,
        colorBack,
        contour,
        innerGlow,
        outerGlow,
        noise,
        angle,
        speed,
        scale,
        fit,
        audioReactivity,
        audioData,
        bassToInnerGlow,
        midToOuterGlow,
        trebleToContour,
        volumeToAngle,
        isCanvas,
    ])

    // Don't render anything on server
    if (!isMounted) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background: colorBack,
                    ...style,
                }}
            />
        )
    }

    return (
        <div
            className={`agent-ui`.trim()}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                background: colorBack,
                ...style,
            }}
        >
            <motion.div
                ref={containerRef}
                initial={
                    isCanvas
                        ? { opacity: 1, scale: 1 }
                        : { opacity: 0, scale: 0.8 }
                }
                animate={
                    isCanvas
                        ? { opacity: 1, scale: 1 }
                        : {
                            opacity: processedImage ? 1 : 0,
                            scale: processedImage
                                ? shouldScale
                                    ? 1
                                    : 0.8
                                : 0.8,
                        }
                }
                transition={
                    isCanvas
                        ? { duration: 0 }
                        : {
                            opacity: {
                                duration: 0.8,
                                ease: [0.33, 1, 0.68, 1],
                                delay: 0.1,
                            },
                            scale: {
                                duration: 0.8,
                                ease: [0.33, 1, 0.68, 1],
                            },
                        }
                }
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    background: "transparent",
                }}
            >
                {error && (
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            color: "#ff4444",
                            fontSize: "12px",
                            textAlign: "center",
                            padding: "8px",
                            zIndex: 1000,
                        }}
                    >
                        {error}
                    </div>
                )}
            </motion.div>
        </div>
    )
}
