import "react";

declare module "react" {
  // Directly augment React's SVGTextElementAttributes interface
  interface SVGTextElementAttributes<T> {
    fg?: string;
    bg?: string;
    attributes?: number;
    wrapMode?: string;
    selectable?: boolean;
    top?: number | string;
    left?: number | string;
    right?: number | string;
    bottom?: number | string;
    width?: number | string;
    height?: number | string;
    style?: any;
    onMouseDown?: (e?: any) => void;
    [key: string]: any; // Catch-all for any other OpenTUI / terminal props
  }

  interface SVGAttributes<T> {
    fg?: string;
    bg?: string;
    attributes?: number;
    wrapMode?: string;
    selectable?: boolean;
    [key: string]: any;
  }

  interface HTMLAttributes<T> {
    fg?: string;
    bg?: string;
    attributes?: number;
    wrapMode?: string;
    selectable?: boolean;
    [key: string]: any;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      box: any;
      scrollbox: any;
      text: any;
      [elemName: string]: any;
    }
  }
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        box: any;
        scrollbox: any;
        text: any;
        [elemName: string]: any;
      }
    }
  }
}

export {};