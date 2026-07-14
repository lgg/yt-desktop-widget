import type { SVGProps } from 'react';

const iconProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeWidth: 1.8,
} satisfies SVGProps<SVGSVGElement>;

export const PlayIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...iconProps} {...props}>
    <path d="m8 6 10 6-10 6V6Z" fill="currentColor" stroke="none" />
  </svg>
);

export const PauseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...iconProps} {...props}>
    <path d="M8 6v12" />
    <path d="M16 6v12" />
  </svg>
);

export const PreviousIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...iconProps} {...props}>
    <path d="M6 7v10" />
    <path d="m18 7-8 5 8 5V7Z" fill="currentColor" stroke="none" />
  </svg>
);

export const NextIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...iconProps} {...props}>
    <path d="M18 7v10" />
    <path d="m6 7 8 5-8 5V7Z" fill="currentColor" stroke="none" />
  </svg>
);

export const SettingsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...iconProps} {...props}>
    <path d="M12 8.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Z" />
    <path d="m19.1 15.25.96 1.66-1.74 3.02-1.9-.46a7.9 7.9 0 0 1-1.54.9l-.55 1.88H9.67l-.55-1.88a7.9 7.9 0 0 1-1.54-.9l-1.9.46L3.94 16.9l.96-1.66a8.66 8.66 0 0 1 0-1.8l-.96-1.66 1.74-3.02 1.9.46c.48-.37 1-.67 1.54-.9l.55-1.88h4.66l.55 1.88c.54.23 1.06.53 1.54.9l1.9-.46 1.74 3.02-.96 1.66c.09.6.09 1.2 0 1.8Z" />
  </svg>
);

export const CloseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...iconProps} {...props}>
    <path d="M7 7 17 17" />
    <path d="M17 7 7 17" />
  </svg>
);

export const LinkIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...iconProps} {...props}>
    <path d="M10 14 21 3" />
    <path d="M15 3h6v6" />
    <path d="M5 7h5" />
    <path d="M3 12v7a2 2 0 0 0 2 2h7" />
  </svg>
);

export const GitHubIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...iconProps} {...props}>
    <path d="M9 19.5c-3.5 1.1-3.5-1.9-5-2.2" />
    <path d="M15 22v-3.1a2.7 2.7 0 0 0-.8-2.1c2.7-.3 5.5-1.3 5.5-5.9a4.6 4.6 0 0 0-1.2-3.1 4.3 4.3 0 0 0-.1-3.1s-1-.3-3.3 1.2a11.3 11.3 0 0 0-6.1 0C6.7 4.4 5.7 4.7 5.7 4.7a4.3 4.3 0 0 0-.1 3.1 4.6 4.6 0 0 0-1.2 3.1c0 4.5 2.8 5.5 5.5 5.9a2.7 2.7 0 0 0-.8 2.1V22" />
  </svg>
);

export const RefreshIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...iconProps} {...props}>
    <path d="M21 12a9 9 0 0 1-15.36 6.36" />
    <path d="M3 12A9 9 0 0 1 18.36 5.64" />
    <path d="M3 5v5h5" />
    <path d="M21 19v-5h-5" />
  </svg>
);

export const SparkIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...iconProps} {...props}>
    <path d="m12 2 1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2Z" fill="currentColor" stroke="none" />
  </svg>
);

export const VolumeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...iconProps} {...props}>
    <path d="M5 9h4l5-4v14l-5-4H5V9Z" />
    <path d="M17 9.5a4 4 0 0 1 0 5" />
    <path d="M19.5 7a7.5 7.5 0 0 1 0 10" />
  </svg>
);

export const MutedIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...iconProps} {...props}>
    <path d="M5 9h4l5-4v14l-5-4H5V9Z" />
    <path d="m17 10 4 4" />
    <path d="m21 10-4 4" />
  </svg>
);

export const LikeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...iconProps} {...props}>
    <path d="M8 10v10H4V10h4Z" />
    <path d="M8 19h8.2a2 2 0 0 0 1.94-1.52l1.35-5.5A2 2 0 0 0 17.55 9H14l.55-3.3A2.32 2.32 0 0 0 12.26 3L8 10Z" />
  </svg>
);

export const DislikeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...iconProps} {...props}>
    <path d="M8 14V4H4v10h4Z" />
    <path d="M8 5h8.2a2 2 0 0 1 1.94 1.52l1.35 5.5A2 2 0 0 1 17.55 15H14l.55 3.3A2.32 2.32 0 0 1 12.26 21L8 14Z" />
  </svg>
);

export const ChevronUpIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...iconProps} {...props}>
    <path d="m6 15 6-6 6 6" />
  </svg>
);

export const ChevronDownIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...iconProps} {...props}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
