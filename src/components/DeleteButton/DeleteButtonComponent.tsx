import { App, Popconfirm } from "antd";
import { useId, useState, type ReactNode } from "react";

interface DeleteButtonProps {
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  errorMessage: string;
  successMessage?: string;
  onConfirm: () => Promise<void> | void;
  children: ReactNode;
  placement?: "top" | "left" | "right" | "bottom" | "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | "leftTop" | "leftBottom" | "rightTop" | "rightBottom";
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
  placement = "topRight",
}: DeleteButtonProps) {
  const { message } = App.useApp();
  const popconfirmId = useId();
  const [state, setState] = useState<ConfirmationState>({ status: "closed", error: null });
  const open = state.status !== "closed";
  const loading = state.status === "submitting";

  const handleConfirm = async () => {
    if (!open || loading) return;
    setState({ status: "submitting", error: null });
    try {
      await onConfirm();
      setState({ status: "closed", error: null });
      message.success(successMessage);
    } catch {
      setState({ status: "error", error: errorMessage });
      message.error(errorMessage);
    }
  };

  return (
    <Popconfirm
      id={popconfirmId}
      forceRender
      open={open}
      onOpenChange={(nextOpen) => setState((current) => current.status === "submitting"
        ? current
        : { status: nextOpen ? "confirming" : "closed", error: null })}
      placement={placement}
      title={title}
      description={<>{description}{loading && <p role="status" aria-live="polite">Processando...</p>}{state.error && <p role="alert">{state.error}</p>}</>}
      okText={confirmText}
      cancelText={cancelText}
      okType="primary"
      okButtonProps={{ loading, danger: false, onClick: handleConfirm }}
      cancelButtonProps={{ disabled: loading }}
      rootClassName="argos-delete-popconfirm"
    >
      {children}
    </Popconfirm>
  );
}
