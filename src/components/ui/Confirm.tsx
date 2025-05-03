import Modal from "./Modal";
import { Button } from "@/components/ui/button.tsx";

export interface Confirmation {
  visible: boolean;
  accept?: () => void;
}

interface ConfirmProps {
  visible: boolean;
  message: string;
  onConfirm?: () => void;
  onClose: () => void;
}

function Confirm({ visible, message, onConfirm, onClose }: ConfirmProps) {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Confirm"
      body={<span>{message}</span>}
      footer={
        <div className="buttons">
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm}>
            OK
          </Button>
        </div>
      }
    ></Modal>
  );
}

export default Confirm;
