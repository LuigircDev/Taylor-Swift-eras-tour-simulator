export const basicVS = /* glsl */`
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;

export const ledFloorFS = /* glsl */`
  uniform float uTime, uBeat; uniform vec3 uC1, uC2; varying vec2 vUv;
  void main(){
    float s = step(0.5, fract(vUv.y*20.0 - uTime*1.5));
    vec3 c = mix(uC1, uC2, s) * (0.2 + uBeat*0.6);
    float edge = smoothstep(0.03, 0.0, min(min(vUv.x,1.0-vUv.x), min(vUv.y,1.0-vUv.y)));
    c += uC2 * edge * 2.0;
    gl_FragColor = vec4(c, 1.0);
  }`;

export const screenFS = /* glsl */`
  uniform float uTime, uBeat, uEnergy; uniform vec3 uC1, uC2, uC3; varying vec2 vUv;
  void main(){
    vec2 uv = vUv; float t = uTime*0.5;
    float w = sin(uv.x*10.0 + t*3.0 + sin(uv.y*6.0+t))*0.5+0.5;
    float r = sin(length((uv-0.5)*vec2(3.0,1.0))*18.0 - t*6.0)*0.5+0.5;
    vec3 col = mix(uC1, uC2, w);
    col = mix(col, uC3, r*0.5*uEnergy);
    vec2 cell = floor(uv*vec2(40.0,12.0));
    float h = fract(sin(dot(cell, vec2(12.9898,78.233)))*43758.5453);
    col += step(0.97, h) * (0.5+0.5*sin(uTime*5.0+h*50.0)) * uC3;
    vec2 g = fract(uv*vec2(160.0,50.0));
    col *= step(0.12,g.x) * step(0.12,g.y);
    col *= 0.45 + uBeat*0.9;
    gl_FragColor = vec4(col, 1.0);
  }`;

export const beamVS = /* glsl */`
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main(){
    vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0);
    vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;

export const beamFS = /* glsl */`
  uniform vec3 uColor; uniform float uBeat; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main(){
    float f = pow(abs(dot(vN,vV)), 1.5);
    float a = pow(vUv.y, 2.0) * f * (0.22 + uBeat*0.5);
    gl_FragColor = vec4(uColor*a, a);
  }`;

export const crowdVS = /* glsl */`
  attribute float aPhase;
  uniform float uTime, uBeat, uMode, uScale; uniform vec3 uC1, uC2, uC3;
  varying vec3 vColor;
  void main(){
    vec3 p = position;
    float ang = atan(p.z, p.x); float d = length(p.xz);
    float wave;
    if (uMode < 0.5)      wave = sin(ang*4.0 - uTime*3.0 + d*0.08)*0.5+0.5;
    else if (uMode < 1.5) wave = step(0.65, fract(sin(aPhase*100.0 + floor(uTime*6.0))*43758.5));
    else                  wave = 0.5+0.5*sin(uTime*6.0);
    vec3 c = mix(uC1, uC2, wave);
    c = mix(c, uC3, step(0.94, fract(aPhase*7.0 + uTime*0.2)));
    vColor = c * (0.35 + uBeat*1.3) * (0.3 + 0.7*wave);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = 0.45 * uScale / -mv.z * (1.0 + uBeat*0.5);
    gl_Position = projectionMatrix * mv;
  }`;

export const crowdFS = /* glsl */`
  varying vec3 vColor;
  void main(){
    float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor*a, a);
  }`;