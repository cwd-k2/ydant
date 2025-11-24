import type {
  Component,
  DefineComponent,
  NativeComponent,
  Reference,
  Props,
  Emits,
  Slots,
} from "@ydant/interface";

class RefrenceImpl<C extends Component> implements Reference<C> {
  private readonly component: C;
  private readonly parent: Node;
  private nodes: Node[];

  constructor(component: C, parent: Node, nodes: Node[]) {
    this.component = component;
    this.parent = parent;
    this.nodes = nodes;
  }

  class(cls: string[]) {
    this.component.class(cls);
    return this;
  }

  style(styles: Record<string, string>) {
    this.component.style(styles);
    return this;
  }

  // @ts-expect-error
  children(...args) {
    // @ts-expect-error
    this.component.children(...args);
    return this;
  }

  // @ts-expect-error
  prop(...args) {
    // @ts-expect-error
    this.component.prop(...args);
    return this;
  }

  // @ts-expect-error
  slot(...args) {
    // @ts-expect-error
    this.component.slot(...args);
    return this;
  }

  // @ts-expect-error
  on(...args) {
    // @ts-expect-error
    this.component.on(...args);
    return this;
  }

  apply(): void {
    if (this.component.isNative) {
      const newElement = createElement(this.component);
      this.parent.replaceChild(newElement, this.nodes[0]);
      this.nodes = [newElement];
    } else {
      const newNodes = processDefine(this.component, this.parent);
      for (const node of this.nodes) this.parent.removeChild(node);
      for (const node of newNodes) this.parent.appendChild(node);
      this.nodes = newNodes;
    }
  }
}

function createElement<T extends string>(component: NativeComponent<T>): Node {
  const element: HTMLElement = document.createElement(component.tag);

  // プロパティ設定
  for (const [key, value] of Object.entries(component.props)) {
    if (key === "class" && Array.isArray(value)) {
      element.className = value.join(" ");
    } else if (key === "style" && typeof value === "object" && value !== null) {
      element.style.cssText = Object.entries(value)
        .map(([k, v]) => `${k}: ${v}`)
        .join("; ");
    } else if (value !== undefined && typeof value === "string") {
      element.setAttribute(key, value);
    }
  }

  // イベントハンドラ設定
  for (const [event, handler] of Object.entries(component.handlers)) {
    if (typeof handler === "function") {
      element.addEventListener(event, handler as EventListener);
    }
  }

  // スロット内容のレンダリング
  for (const children of Object.values(component.slots).filter(v => v !== undefined)) {
    for (const child of processDefine(children, element)) {
      element.appendChild(child);
    }
  }

  return element;
}

function* sequence(gs: Iterable<any>[]) {
  for (const g of gs) yield* g;
}

function processDefine<P extends Props, E extends Emits, S extends Slots>(
  component: DefineComponent<P, E, S>,
  parent: Node
): Node[] {
  const nodes = [];

  let iter = component.build(
    key => component.props[key],
    key =>
      (...args) =>
        component.handlers[key]?.(...args) && void 0,
    key => component.slots[key]
  );
  if (Array.isArray(iter)) iter = sequence(iter);
  let result = iter.next();

  while (!result.done) {
    const { value } = result;

    if (typeof value === "string") {
      const node = document.createTextNode(value);
      nodes.push(node);
      parent.appendChild(node);

      result = iter.next();
    } else if (value.isNative) {
      const element = createElement(value);
      nodes.push(element);
      parent.appendChild(element);

      result = iter.next(new RefrenceImpl(value, parent, [element]));
    } else if (!value.isNative) {
      const children = processDefine(value, parent);
      nodes.push(...children);
      // no append here, children are already appended in recursive call
      // keep in mind that components you define are not actually DOM elements

      result = iter.next(new RefrenceImpl(value, parent, children));
    }
  }

  return nodes;
}

export function render(component: Component, parent: HTMLElement): void {
  parent.innerHTML = "";
  if (component.isNative) {
    const element = createElement(component);
    parent.appendChild(element);
  } else {
    processDefine(component, parent);
  }
}
