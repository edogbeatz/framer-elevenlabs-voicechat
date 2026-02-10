// Type stubs for Radix UI packages used in ChatInput
declare module "@radix-ui/react-form" {
    import * as React from "react"
    export const Root: React.FC<React.FormHTMLAttributes<HTMLFormElement> & { children?: React.ReactNode }>
    export const Field: React.FC<{ name: string; children?: React.ReactNode }>
    export const Label: React.FC<{ children?: React.ReactNode }>
    export const Control: React.FC<{ asChild?: boolean; children?: React.ReactNode }>
    export const Message: React.FC<React.HTMLAttributes<HTMLSpanElement> & { children?: React.ReactNode }>
}

declare module "@radix-ui/react-visually-hidden" {
    import * as React from "react"
    export const Root: React.FC<{ children?: React.ReactNode }>
}
