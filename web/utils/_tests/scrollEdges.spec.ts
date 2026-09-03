import { describe, it, expect } from 'vitest';

import { scrollEdges } from '../scrollEdges';

import type { ScrollMetrics } from '../scrollEdges';

// * A region 100 tall showing 300 of content, unscrolled horizontally. Cases override only what they are about.
function metrics(overrides: Partial<ScrollMetrics> = {}): ScrollMetrics {
  return {
    scrollTop: 0,
    clientHeight: 100,
    scrollHeight: 300,
    scrollLeft: 0,
    clientWidth: 100,
    scrollWidth: 100,
    ...overrides
  };
}

describe('scrollEdges', () => {
  it('marks no edge on a region whose content fits', () => {
    expect(scrollEdges(metrics({ scrollHeight: 100 }))).toEqual({
      top: false,
      bottom: false,
      left: false,
      right: false
    });
  });

  describe('per edge, never per region', () => {
    it('marks only the bottom at the start of the scroll', () => {
      const edges = scrollEdges(metrics({ scrollTop: 0 }));

      // * The whole point of the rule: a top border here would claim content above that does not exist.
      expect(edges.top).toBe(false);
      expect(edges.bottom).toBe(true);
    });

    it('marks both edges in the middle of the scroll', () => {
      const edges = scrollEdges(metrics({ scrollTop: 100 }));

      expect(edges.top).toBe(true);
      expect(edges.bottom).toBe(true);
    });

    it('marks only the top at the end of the scroll', () => {
      const edges = scrollEdges(metrics({ scrollTop: 200 }));

      expect(edges.top).toBe(true);
      expect(edges.bottom).toBe(false);
    });
  });

  describe('fractional device pixel ratios', () => {
    // ! These are the cases that only reproduce on a device whose DPR is not a whole number — the three values round independently, so an exact comparison leaves a border stuck on.
    it('clears the bottom edge when the end lands a fraction short', () => {
      expect(scrollEdges(metrics({ scrollTop: 199.5 })).bottom).toBe(false);
    });

    it('clears the top edge when the start lands a fraction over', () => {
      expect(scrollEdges(metrics({ scrollTop: 0.5 })).top).toBe(false);
    });

    it('still marks an edge hiding more than the tolerance', () => {
      expect(scrollEdges(metrics({ scrollTop: 1.5 })).top).toBe(true);
    });
  });

  describe('the horizontal axis', () => {
    it('marks only the right at the start of the scroll', () => {
      const edges = scrollEdges(
        metrics({ scrollWidth: 300, scrollLeft: 0 }),
        'horizontal'
      );

      expect(edges.left).toBe(false);
      expect(edges.right).toBe(true);
    });

    it('marks only the left at the end of the scroll', () => {
      const edges = scrollEdges(
        metrics({ scrollWidth: 300, scrollLeft: 200 }),
        'horizontal'
      );

      expect(edges.left).toBe(true);
      expect(edges.right).toBe(false);
    });
  });

  describe('the axis narrows what is reported', () => {
    const scrollingBothWays = metrics({
      scrollTop: 100,
      scrollWidth: 300,
      scrollLeft: 100
    });

    it('reports only the vertical edges on a vertical region', () => {
      expect(scrollEdges(scrollingBothWays, 'vertical')).toEqual({
        top: true,
        bottom: true,
        left: false,
        right: false
      });
    });

    it('reports only the horizontal edges on a horizontal region', () => {
      expect(scrollEdges(scrollingBothWays, 'horizontal')).toEqual({
        top: false,
        bottom: false,
        left: true,
        right: true
      });
    });

    it('reports all four on a region that scrolls both ways', () => {
      expect(scrollEdges(scrollingBothWays, 'both')).toEqual({
        top: true,
        bottom: true,
        left: true,
        right: true
      });
    });

    it('defaults to the vertical axis, the common case', () => {
      expect(scrollEdges(scrollingBothWays)).toEqual(
        scrollEdges(scrollingBothWays, 'vertical')
      );
    });
  });
});
