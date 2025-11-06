declare module "react" {
  interface ChangeEvent<T = Element> {
    target: T;
    currentTarget: T;
  }

  interface MouseEvent<T = Element> {
    target: T;
    currentTarget: T;
  }

  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    value?: string | ReadonlyArray<string> | number;
    onChange?: (event: ChangeEvent<T>) => void;
  }

  interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    onClick?: (event: MouseEvent<T>) => void;
    disabled?: boolean;
  }

  interface HTMLAttributes<T> {
    className?: string;
    style?: { [key: string]: string | number };
    [key: string]: any;
  }
}