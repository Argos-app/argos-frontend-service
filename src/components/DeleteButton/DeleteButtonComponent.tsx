import { App, Popconfirm } from "antd";
import { useState, type ReactNode } from "react";

interface DeleteButtonProps {
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  errorMessage: string;
  onConfirm: () => Promise<void> | void;
  children: ReactNode;
  placement?: "top" | "left" | "right" | "bottom" | "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | "leftTop" | "leftBottom" | "rightTop" | "rightBottom";
}

export function DeleteButton({
  title,
  description,
  confirmText,
  cancelText,
  errorMessage,
  onConfirm,
  children,
  placement = "topRight",
}: DeleteButtonProps) {
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch {
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popconfirm
      open={open}
      onOpenChange={setOpen}
      placement={placement}
      title={title}
      description={description}
      okText={confirmText}
      cancelText={cancelText}
      okType="primary"
      okButtonProps={{ loading, danger: false }}
      rootClassName="argos-delete-popconfirm"
      onConfirm={handleConfirm}
    >
      {children}
    </Popconfirm>
  );
}
