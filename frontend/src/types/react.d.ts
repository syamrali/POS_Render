declare module 'react' {
  export = React;
  export as namespace React;

  declare namespace React {
    export type FC<P = {}> = FunctionComponent<P>;
    export interface FunctionComponent<P = {}> {
      (props: P & { children?: ReactNode }, context?: any): ReactElement<any, any> | null;
    }

    export type ReactNode = ReactElement | string | number | Iterable<ReactNode> | ReactPortal | boolean | null | undefined;
    
    export interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
      type: T;
      props: P;
      key: Key | null;
    }

    export type Key = string | number;
    
    export interface JSXElementConstructor<P> {
      (props: P): ReactElement<any, any> | null;
    }

    export type ReactPortal = any;

    export type DetailedHTMLProps<E extends HTMLAttributes<T>, T> = ClassAttributes<T> & E;
    
    export interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
      className?: string;
      style?: CSSProperties;
      [key: string]: any;
    }

    export interface AriaAttributes {
      [key: string]: any;
    }

    export interface DOMAttributes<T> {
      children?: ReactNode;
      [key: string]: any;
    }

    export interface ClassAttributes<T> {
      [key: string]: any;
    }

    export interface CSSProperties {
      [key: string]: any;
    }

    export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prevValue: T) => T)) => void];
    export function useEffect(effect: () => (void | (() => void)), deps?: readonly any[]): void;
    export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly any[]): T;
    export function useMemo<T>(factory: () => T, deps: readonly any[]): T;
  }
}