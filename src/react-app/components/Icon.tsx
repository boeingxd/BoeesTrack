const PATHS = {
	back: "m15 18-6-6 6-6",
	backspace: "M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2ZM18 9l-6 6M12 9l6 6",
	check: "M20 6 9 17l-5-5",
	down: "m6 9 6 6 6-6",
	edit: "M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z",
	forward: "m9 18 6-6-6-6",
	clip: "m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48",
	close: "M18 6 6 18M6 6l12 12",
	plus: "M5 12h14M12 5v14",
	warning: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3ZM12 9v4M12 17h.01",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d={PATHS[name]} />
		</svg>
	);
}

// A purpose-drawn paperclip that straddles the top edge of a slip page.
export function ClipMark() {
	return (
		<svg width="20" height="26" viewBox="0 0 22 28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
			<path d="M7 2v15a3 3 0 0 0 6 0V5a5 5 0 0 0-10 0v13a8 8 0 0 0 16 0V8" />
		</svg>
	);
}
