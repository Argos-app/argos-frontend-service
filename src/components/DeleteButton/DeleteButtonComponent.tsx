import { App, Modal } from "antd";
import { cloneElement, useState, type ButtonHTMLAttributes, type ReactElement } from "react";
import { useLifetime } from "@/hooks/useLifetime";

interface DeleteButtonProps {
	title: string;
	description: string;
	confirmText: string;
	cancelText: string;
	errorMessage: string;
	successMessage?: string;
	onConfirm: () => Promise<void> | void;
	children: ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>;
}

type ConfirmationState =
	| { status: "closed" | "confirming" | "submitting"; error: null }
	| { status: "error"; error: string };

export function DeleteButton({
	title,
	description,
	confirmText,
	cancelText,
	errorMessage,
	successMessage = "Operação concluída com sucesso.",
	onConfirm,
	children,
}: DeleteButtonProps) {
	const { message } = App.useApp();
	const [state, setState] = useState<ConfirmationState>({ status: "closed", error: null });
	const open = state.status !== "closed";
	const loading = state.status === "submitting";
	const lifetime = useLifetime();

	const handleConfirm = async () => {
		const owner = lifetime.current;
		if (!owner || !open || loading) return;
		setState({ status: "submitting", error: null });
		try {
			await onConfirm();
			if (lifetime.current !== owner) return;
			setState({ status: "closed", error: null });
			message.success(successMessage);
		} catch {
			if (lifetime.current !== owner) return;
			setState({ status: "error", error: errorMessage });
			message.error(errorMessage);
		}
	};

	return (
		<>
			{cloneElement(children, {
				onClick: (event) => {
					children.props.onClick?.(event);
					if (!event.defaultPrevented) setState({ status: "confirming", error: null });
				},
				"aria-haspopup": "dialog",
			})}
		<Modal
			open={open}
			onCancel={() => { if (!loading) setState({ status: "closed", error: null }); }}
			onOk={() => void handleConfirm()}
			maskClosable={!loading}
			keyboard={!loading}
			closable={!loading}
			title={title}
			okText={confirmText}
			cancelText={cancelText}
			okType="primary"
			confirmLoading={loading}
			cancelButtonProps={{ disabled: loading }}
			destroyOnHidden
		>
			<p>{description}</p>
			{loading && <p role="status" aria-live="polite">Processando...</p>}
			{state.error && <p role="alert">{state.error}</p>}
		</Modal>
		</>
	);
}
