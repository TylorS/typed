export class PathStack {
  path: Array<number> = [0];

  inc(): void {
    this.path[this.path.length - 1] += 1;
  }

  push(): void {
    this.path.push(0);
  }

  pop(): void {
    this.path.pop();
  }

  toChunk(): Array<number> {
    return this.path.slice(0);
  }

  previousChunk(): Array<number> {
    return this.path.slice(0, -1);
  }
}
