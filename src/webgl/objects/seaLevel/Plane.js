import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";

export class Plane {
  constructor() {
    this.mesh = null;
    this.width = 4000;
    this.height = 4000;

    this.init();
  }

  init() {
    const geometry = new THREE.PlaneGeometry(this.width, this.height);

    this.mesh = new Water(geometry, {
      textureWidth: 4000,
      textureHeight: 4000,
      waterNormals: new THREE.TextureLoader().load(
        "/textures/waternormals.png",
        (texture) => {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        },
      ),
      sunDirection: new THREE.Vector3(1, 1, 1).normalize(),
      sunColor: 0xffffff,
      waterColor: 0x2d7290,
      distortionScale: 20,
      size: 0.3,
      fog: false,
    });

    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(-2000, -20, 2000);

    // Causticsシェーダーを追加
    this.mesh.material.onBeforeCompile = (shader) => {
      // shaderへの参照を保存（updateで使用）
      this.mesh.material.userData.shader = shader;

      // カスタムuniformを追加
      shader.uniforms.uTime = { value: 0 };

      // ここにStep 2, 3を追加していきます
      // Caustics関数をfragmentShaderの先頭に追加
      shader.fragmentShader = shader.fragmentShader.replace(
        "void main() {",
        `
        uniform float uTime;

        // Caustics関数
        vec3 caustics(vec2 uv, float time) {
          float TAU = 6.28318530718;
          vec2 p = mod(uv * TAU, TAU) - 250.0;
          vec2 i = vec2(p);
          float c = 1.0;
          float inten = 0.01;
          for (int n = 0; n < 3; n++) {
            float t = time * (1.0 - (1.5 / float(n + 1)));
            i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
            c += 1.0 / length(vec2(p.x / (sin(i.x + t) / inten), p.y / (cos(i.y + t) / inten)));
          }
          c /= 3.0;
          c = 1.17 - pow(c, 1.4);
          vec3 color = vec3(pow(abs(c), 20.0));
          return clamp(color, 0.0, 1.0);
        }
        void main() {
        `,
      );

      // gl_FragColorにCausticsを適用
      shader.fragmentShader = shader.fragmentShader.replace(
        "gl_FragColor = vec4( outgoingLight, alpha );",
        `
        vec3 causticsColor = caustics(worldPosition.xz * 0.0005, uTime * 0.5);
        outgoingLight += causticsColor * 0.5;

        // 水の色を追加
        vec3 waterTint = vec3(0.125, 0.392, 0.455);
        outgoingLight += waterTint * 0.2;

        gl_FragColor = vec4( outgoingLight, alpha );
        `,
      );
    };
  }

  update(time) {
    if (this.mesh && this.mesh.material.uniforms["time"]) {
      this.mesh.material.uniforms["time"].value = time * 1.2;
    }

    // Causticsのtime更新
    if (this.mesh.material.userData.shader) {
      this.mesh.material.userData.shader.uniforms.uTime.value = time;
    }
  }

  getMesh() {
    return this.mesh;
  }

  // パラメータ調整用メソッド
  setWaterColor(color) {
    this.mesh.material.uniforms["waterColor"].value.set(color);
  }

  setDistortionScale(scale) {
    this.mesh.material.uniforms["distortionScale"].value = scale;
  }

  setSunDirection(x, y, z) {
    this.mesh.material.uniforms["sunDirection"].value.set(x, y, z).normalize();
  }
}
