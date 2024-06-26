import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  Directive,
  Signal,
  computed,
  inject,
  input,
  signal,
} from "@angular/core";
import { Triplet } from "@pmndrs/cannon-worker-api";
import { NgtArgs, NgtCanvas, extend, injectBeforeRender } from "angular-three";
import { NgtcPhysics, NgtcPhysicsContent } from "angular-three-cannon";
import {
  NgtcBodyReturn,
  injectBox,
  injectPlane,
  injectSphere,
} from "angular-three-cannon/body";
import { createNoopInjectionToken } from "ngxtension/create-injection-token";
import {
  BoxGeometry,
  Color,
  HemisphereLight,
  InstancedBufferAttribute,
  InstancedMesh,
  Mesh,
  MeshLambertMaterial,
  Object3D,
  PlaneGeometry,
  ShadowMaterial,
  SphereGeometry,
  SpotLight,
} from "three";

const shape = signal<"box" | "sphere">("box");
const niceColors = [
  "#99b898",
  "#fecea8",
  "#ff847c",
  "#e84a5f",
  "#2a363b",
] as const;

extend({
  Mesh,
  PlaneGeometry,
  ShadowMaterial,
  BoxGeometry,
  SphereGeometry,
  Color,
  SpotLight,
  HemisphereLight,
  MeshLambertMaterial,
  InstancedMesh,
  InstancedBufferAttribute,
});

@Component({
  selector: "app-plane",
  standalone: true,
  template: `
    <ngt-mesh [ref]="plane.ref" [receiveShadow]="true">
      <ngt-plane-geometry *args="[10, 10]" />
      <ngt-shadow-material color="#171717" />
    </ngt-mesh>
  `,
  imports: [NgtArgs],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Plane {
  rotation = input<Triplet>([0, 0, 0]);
  plane = injectPlane(() => ({ rotation: this.rotation() }));
}

const [injectBodyFn, provideBodyFn] = createNoopInjectionToken<
  (size: Signal<number>) => NgtcBodyReturn<Object3D>
>("InjectBody", { isFunctionValue: true });

@Directive({ standalone: true })
export class InstancesInput {
  count = input(200);
  size = input(0.1);
  colors = input.required<Float32Array>();

  body = injectBodyFn()(this.size);

  constructor() {
    injectBeforeRender(() => {
      this.body.api
        ?.at(Math.floor(Math.random() * this.count()))
        .position.set(0, Math.random() * 2, 0);
    });
  }
}

const instancesInputs = ["count", "size", "colors"];

@Component({
  selector: "app-boxes",
  standalone: true,
  template: `
    <ngt-instanced-mesh
      *args="[undefined, undefined, inputs.count()]"
      [receiveShadow]="true"
      [castShadow]="true"
      [ref]="inputs.body.ref"
    >
      <ngt-box-geometry *args="[inputs.size(), inputs.size(), inputs.size()]">
        <ngt-instanced-buffer-attribute
          attach="attributes.color"
          *args="[inputs.colors(), 3]"
        />
      </ngt-box-geometry>
      <ngt-mesh-lambert-material [vertexColors]="true" />
    </ngt-instanced-mesh>
  `,
  imports: [NgtArgs],
  hostDirectives: [{ directive: InstancesInput, inputs: instancesInputs }],
  providers: [
    provideBodyFn((size) =>
      injectBox(() => ({
        args: [size(), size(), size()],
        mass: 1,
        position: [Math.random() - 0.5, Math.random() * 2, Math.random() - 0.5],
      })),
    ),
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Boxes {
  inputs = inject(InstancesInput, { host: true });
}

@Component({
  selector: "app-spheres",
  standalone: true,
  template: `
    <ngt-instanced-mesh
      *args="[undefined, undefined, inputs.count()]"
      [receiveShadow]="true"
      [castShadow]="true"
      [ref]="inputs.body.ref"
    >
      <ngt-sphere-geometry *args="[inputs.size(), 48, 48]">
        <ngt-instanced-buffer-attribute
          attach="attributes.color"
          *args="[inputs.colors(), 3]"
        />
      </ngt-sphere-geometry>
      <ngt-mesh-lambert-material [vertexColors]="true" />
    </ngt-instanced-mesh>
  `,
  imports: [NgtArgs],
  hostDirectives: [{ directive: InstancesInput, inputs: instancesInputs }],
  providers: [
    provideBodyFn((size) =>
      injectSphere(() => ({
        args: [size()],
        mass: 1,
        position: [Math.random() - 0.5, Math.random() * 2, Math.random() - 0.5],
      })),
    ),
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Spheres {
  inputs = inject(InstancesInput, { host: true });
}

@Component({
  standalone: true,
  template: `
    <ngt-color attach="background" *args="['lightblue']" />
    <ngt-hemisphere-light [intensity]="0.35 * Math.PI" />
    <ngt-spot-light
      [angle]="0.3"
      [castShadow]="true"
      [decay]="0"
      [intensity]="2 * Math.PI"
      [penumbra]="1"
      [position]="[10, 10, 10]"
    />

    <ngtc-physics [options]="{ broadphase: 'SAP' }">
      <ng-template physicsContent>
        <app-plane [rotation]="[-Math.PI / 2, 0, 0]" />
        @if (shape() === "box") {
          <app-boxes [count]="count()" [size]="size()" [colors]="colors()" />
        } @else {
          <app-spheres [count]="count()" [size]="size()" [colors]="colors()" />
        }
      </ng-template>
    </ngtc-physics>
  `,
  imports: [NgtArgs, NgtcPhysics, NgtcPhysicsContent, Plane, Boxes, Spheres],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "scene-experience" },
})
export class Scene {
  Math = Math;
  shape = shape.asReadonly();

  size = signal(0.1);
  count = signal(200);
  colors = computed(() => {
    const array = new Float32Array(this.count() * 3);
    const color = new Color();
    for (let i = 0; i < this.count(); i++)
      color
        .set(niceColors[Math.floor(Math.random() * 5)])
        .convertSRGBToLinear()
        .toArray(array, i * 3);
    return array;
  });
}

@Component({
  selector: "app-experience",
  standalone: true,
  template: `
    <ngt-canvas
      [sceneGraph]="scene"
      [shadows]="true"
      [camera]="{ fov: 50, position: [-1, 1, 2.5] }"
      (pointerMissed)="onPointerMissed()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgtCanvas],
  styles: `
    :host {
      display: block;
      height: 100dvh;
    }
  `,
})
export class Experience {
  scene = Scene;

  onPointerMissed() {
    shape.update((prev) => (prev === "box" ? "sphere" : "box"));
  }
}
