/**
 * Type stubs for the Framer runtime module.
 * 
 * The "framer" package is only available inside Framer's design tool runtime.
 * These stubs allow TypeScript to compile source files that import from "framer"
 * without needing the full Framer SDK as a dependency.
 */
declare module "framer" {
    export function addPropertyControls(component: any, controls: Record<string, any>): void

    export const ControlType: {
        String: string
        Number: string
        Boolean: string
        Enum: string
        Color: string
        Object: string
        Array: string
        File: string
        Image: string
        Link: string
        ComponentInstance: string
        EventHandler: string
        Transition: string
        FusedNumber: string
        Font: string
        Padding: string
        Border: string
        ResponsiveImage: string
    }

    export const RenderTarget: {
        current: () => string
        canvas: string
        preview: string
        export: string
        thumbnail: string
    }

    export interface FramerRoute {
        path?: string
        [key: string]: any
    }

    export function useRouter(): {
        navigate: (path: string) => void
        back: () => void
        routes?: Record<string, FramerRoute>
    } | null
}
