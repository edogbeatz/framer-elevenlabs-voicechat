import * as React from "react"

export const IconSend = ({ size = 18, ...props }: Omit<React.SVGProps<SVGSVGElement>, "ref"> & { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
)

export const IconMic = ({ size = 20, ...props }: Omit<React.SVGProps<SVGSVGElement>, "ref"> & { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
)

export const IconMicOff = ({ size = 20, ...props }: Omit<React.SVGProps<SVGSVGElement>, "ref"> & { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="1" y1="1" x2="23" y2="23"></line>
        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
)

export const IconEnd = ({ size = 20, ...props }: Omit<React.SVGProps<SVGSVGElement>, "ref"> & { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10"></circle>
        <rect x="9" y="9" width="6" height="6"></rect>
    </svg>
)

export const IconWaveform = ({ size = 20, ...props }: Omit<React.SVGProps<SVGSVGElement>, "ref"> & { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M2 12h2"></path>
        <path d="M6 8v8"></path>
        <path d="M10 6v12"></path>
        <path d="M14 4v16"></path>
        <path d="M18 6v12"></path>
        <path d="M22 8v8"></path>
    </svg>
)

export const IconDisconnect = ({ size = 20, ...props }: Omit<React.SVGProps<SVGSVGElement>, "ref"> & { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
        <line x1="23" y1="1" x2="1" y2="23"></line>
    </svg>
)

export const IconCopy = ({ size = 14, ...props }: Omit<React.SVGProps<SVGSVGElement>, "ref"> & { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
)

export const IconCheck = ({ size = 14, ...props }: Omit<React.SVGProps<SVGSVGElement>, "ref"> & { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
)

export const IconKeyboard = ({ size = 20, ...props }: Omit<React.SVGProps<SVGSVGElement>, "ref"> & { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
        <line x1="6" y1="8" x2="6.01" y2="8"></line>
        <line x1="10" y1="8" x2="10.01" y2="8"></line>
        <line x1="14" y1="8" x2="14.01" y2="8"></line>
        <line x1="18" y1="8" x2="18.01" y2="8"></line>
        <line x1="8" y1="12" x2="8.01" y2="12"></line>
        <line x1="12" y1="12" x2="12.01" y2="12"></line>
        <line x1="16" y1="12" x2="16.01" y2="12"></line>
        <line x1="7" y1="16" x2="17" y2="16"></line>
    </svg>
)

export const IconClose = ({ size = 20, ...props }: Omit<React.SVGProps<SVGSVGElement>, "ref"> & { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
)

