import {mat2d, vec2} from "gl-matrix";

export function mat() {
  const stack = [mat2d.create()];
  const lastof = (a) => a[a.length - 1];

  return {
    translate(x, y) {
      const last = lastof(stack);
      mat2d.translate(last, last, vec2.fromValues(x, y));
      return this;
    },
    rotate(angle) {
      const last = lastof(stack);
      mat2d.rotate(last, last, angle * (Math.PI / 180));
      return this;
    },
    push() {
      const last = lastof(stack);
      stack.push(mat2d.clone(last));
      return this;
    },
    pop() {
      stack.pop();
      return this;
    },
    transform() {
      const last = lastof(stack) ?? mat2d.create();
      return `matrix(${last[0]} ${last[1]} ${last[2]} ${last[3]} ${last[4]} ${last[5]})`;
    },
  };
}
