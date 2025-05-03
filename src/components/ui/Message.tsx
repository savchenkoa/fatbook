import { PropsWithChildren } from "react";
import { FaInfoCircle } from "react-icons/fa";
import { clsx } from "clsx";
import { CloseButton } from "@/components/ui/close-button.tsx";

interface MessageProps {
  title?: string;
  onClose?: () => void;
  severity?: string;
  className?: string;
  bodyClassName?: string;
}

function Message({
  title,
  onClose,
  children,
  severity = "is-info",
  className = "",
  bodyClassName,
}: PropsWithChildren<MessageProps>) {
  return (
    <article className={"message " + severity + " " + className}>
      {title && (
        <div className="message-header">
          <p className="is-flex is-align-items-center">
            <span className="icon is-medium">
              <FaInfoCircle />
            </span>
            {title}
          </p>
          {onClose && <CloseButton onClick={onClose} />}
        </div>
      )}
      <div
        className={clsx(
          "message-body background-info-95-use-theme",
          bodyClassName,
        )}
      >
        {children}
      </div>
    </article>
  );
}

export default Message;
