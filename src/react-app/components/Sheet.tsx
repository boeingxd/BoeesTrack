import { useEffect, useRef } from "react";
import { Icon } from "./Icon";

type Props = {
	title: string;
	onClose: () => void;
	children: React.ReactNode;
};

// A choice that belongs to the screen underneath: it rises from the bottom, and the screen stays in view behind it.
// Closes with the X, a tap on the dimmed screen, or Escape.
export function Sheet({ title, onClose, children }: Props) {
	const panel = useRef<HTMLDivElement>(null);
	// Callers pass a new onClose every render; a ref keeps the effect from refocusing the panel while someone is typing.
	const close = useRef(onClose);
	useEffect(() => {
		close.current = onClose;
	});

	useEffect(() => {
		panel.current?.focus();
		const onKey = (event: KeyboardEvent) => event.key === "Escape" && close.current();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	return (
		<div className="drawer" onClick={(event) => event.target === event.currentTarget && onClose()}>
			<div className="drawer__panel" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={panel}>
				<header className="topbar">
					<button type="button" className="icon-btn" onClick={onClose} aria-label={`Close ${title.toLowerCase()}`}>
						<Icon name="close" />
					</button>
					<h2 className="topbar__title">{title}</h2>
					<span className="topbar__spacer" aria-hidden="true" />
				</header>
				{children}
			</div>
		</div>
	);
}
