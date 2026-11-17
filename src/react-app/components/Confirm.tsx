import type { ReactNode } from "react";
import { Icon } from "./Icon";

type Props = {
	// The warning: what will happen, and that it cannot be undone.
	children: ReactNode;
	keep?: string;
	yes: string;
	onKeep: () => void;
	onYes: () => void;
	className?: string;
};

// The one way the app asks before something that cannot be undone: a red warning line, then the safe choice first.
export function Confirm({ children, keep = "Keep it", yes, onKeep, onYes, className }: Props) {
	return (
		<div className={className ? `detail__confirm ${className}` : "detail__confirm"}>
			<p className="today__note today__note--warn" role="alert">
				<Icon name="warning" size={18} />
				<span>{children}</span>
			</p>
			<button type="button" className="detail__btn detail__btn--keep" onClick={onKeep}>
				{keep}
			</button>
			<button type="button" className="detail__btn detail__btn--delete" onClick={onYes}>
				{yes}
			</button>
		</div>
	);
}
