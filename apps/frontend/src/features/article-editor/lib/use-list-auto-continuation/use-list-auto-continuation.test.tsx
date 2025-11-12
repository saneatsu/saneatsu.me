import { render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { useListAutoContinuation } from "./use-list-auto-continuation";

function TestComponent({
	value,
	onChange,
}: {
	value: string;
	onChange: (val: string) => void;
}) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const setValue = vi.fn();
	useListAutoContinuation({
		textareaRef,
		setMarkdownValue: onChange,
		setValue,
	});
	return (
		<textarea ref={textareaRef} defaultValue={value} aria-label="editor" />
	);
}

describe("useListAutoContinuation", () => {
	it("IME変換中のEnterではリストを拡張しない", () => {
		const onChange = vi.fn();
		render(<TestComponent value="- げつようび" onChange={onChange} />);
		const textarea = screen.getByLabelText("editor") as HTMLTextAreaElement;
		textarea.focus();
		textarea.setSelectionRange(textarea.value.length, textarea.value.length);
		const event = new KeyboardEvent("keydown", {
			key: "Enter",
			bubbles: true,
			cancelable: true,
		});
		Object.defineProperty(event, "isComposing", {
			value: true,
			configurable: true,
		});
		window.dispatchEvent(event);
		expect(onChange).not.toHaveBeenCalled();
	});
});
