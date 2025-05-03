import { ReactNode, useEffect } from "react";
import { CloseButton } from "@/components/ui/close-button.tsx";

interface ModalProps {
  visible: boolean;
  title: string;
  body?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}

function Modal({ visible, onClose, body, footer, title }: ModalProps) {
  const closeOnEscapeKeydown = (event: KeyboardEvent) => {
    if (visible && event.code === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    document.body.addEventListener("keydown", closeOnEscapeKeydown);
    return function cleanup() {
      document.body.removeEventListener("keydown", closeOnEscapeKeydown);
    };
  }, []);

  return (
    <div className={"modal" + (visible ? " is-active" : "")}>
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-card px-2">
        <header className="modal-card-head p-5">
          <p className="modal-card-title">{title}</p>
          <CloseButton onClick={onClose} />
        </header>
        <section className="modal-card-body">{body}</section>
        <footer className="modal-card-foot is-justify-content-end p-4">
          {footer}
        </footer>
      </div>
    </div>
  );
}

export default Modal;
