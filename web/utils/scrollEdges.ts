export type ScrollAxis = 'vertical' | 'horizontal' | 'both';

export type ScrollMetrics = {
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
  scrollLeft: number;
  clientWidth: number;
  scrollWidth: number;
};

export type ScrollEdges = {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
};

// ! Compared with a tolerance rather than exactly. On a fractional device pixel ratio the browser rounds scrollTop, clientHeight and scrollHeight independently, so a region scrolled fully to the end lands a fraction short of its own scrollHeight and the bottom border never clears — a bug that shows on a phone and never on the machine it was written on.
const TOLERANCE_PX = 1;

/**
 * Which edges of a scrolling region are currently hiding content, per edge rather than per region
 * (`catalyst/stacks/frontend/_common/scroll-affordance.md`). One boolean for the whole region would
 * paint a top border while the user sits at the top, and a line that lies at both ends stops being read.
 *
 * Pure on purpose: this is where the mistakes are, and a DOM stub reports every measurement as 0.
 */
export function scrollEdges(
  metrics: ScrollMetrics,
  axis: ScrollAxis = 'vertical'
): ScrollEdges {
  const vertical = axis !== 'horizontal';
  const horizontal = axis !== 'vertical';

  return {
    top: vertical && metrics.scrollTop > TOLERANCE_PX,
    bottom:
      vertical &&
      metrics.scrollTop + metrics.clientHeight <
        metrics.scrollHeight - TOLERANCE_PX,
    left: horizontal && metrics.scrollLeft > TOLERANCE_PX,
    right:
      horizontal &&
      metrics.scrollLeft + metrics.clientWidth <
        metrics.scrollWidth - TOLERANCE_PX
  };
}
