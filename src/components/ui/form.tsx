import { FormHTMLAttributes, ReactNode, startTransition } from "react";

type Props = FormHTMLAttributes<unknown> & {
  action: (payload: FormData) => void;
  children: ReactNode;
};

// Workaround for React resetting the <form> with action by default (as browsers do)
// https://github.com/facebook/react/issues/29034
// The fix is to call event.preventDefault before submitting and call action manually
export function Form({ action, children, ...props }: Props) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(() => {
      action(new FormData(event.currentTarget));
    });
  };
  return (
    <form {...props} action={action} onSubmit={handleSubmit}>
      {children}
    </form>
  );
}
