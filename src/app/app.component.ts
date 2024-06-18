import { Component } from "@angular/core";
import { Experience } from "./experience";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [Experience],
  template: `
    <app-experience />
    <div class="text">* click to change shape</div>
  `,
  styles: `
    .text {
      position: absolute;
      left: 0.5rem;
      top: 0.5rem;
      font-family: monospace;
      color: black;
      font-weight: bold;
      font-size: 1rem;
    }
  `,
})
export class AppComponent {}
