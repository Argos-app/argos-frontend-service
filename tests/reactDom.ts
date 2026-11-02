import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";

let root: Root | null;
let container: HTMLDivElement;

export async function render(element: ReactNode) {
	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
	await act(async () => {
		root.render(element);
	});
}

export async function cleanup() {
	await act(async () => {
		root?.unmount();
	});
	root = null;
	container?.remove();
}

export async function rerender(element: ReactNode) {
	await act(async () => {
		root!.render(element);
	});
}

export async function change(id: string, value: string) {
	const input = document.getElementById(id) as HTMLInputElement;
	await act(async () => {
		Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
			input,
			value,
		);
		input.dispatchEvent(new Event("input", { bubbles: true }));
	});
}

export async function submit() {
	await act(async () => {
		document
			.querySelector("form")!
			.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
	});
}

export async function click(element: HTMLElement) {
	await act(async () => {
		element.click();
	});
}

export function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason: unknown) => void;
	const promise = new Promise<T>((done, fail) => {
		resolve = done;
		reject = fail;
	});
	return { promise, resolve, reject };
}
