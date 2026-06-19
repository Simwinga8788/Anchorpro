'use client';

import { useEffect, useRef } from 'react';

/**
 * Wraps a <table class="data-table"> and auto-injects data-label attributes
 * on each <td> so the CSS mobile card layout can display column headers.
 * 
 * Usage: <ResponsiveTable>
 *          <table className="data-table">...</table>
 *        </ResponsiveTable>
 */
export default function ResponsiveTable({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const applyLabels = () => {
      const table = container.querySelector('table');
      if (!table) return;

      const headers = Array.from(table.querySelectorAll('thead th'));
      const labels = headers.map(th => th.textContent?.trim() || '');

      const rows = table.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        cells.forEach((td, i) => {
          if (labels[i]) {
            td.setAttribute('data-label', labels[i]);
          }
        });
      });
    };

    // Apply labels on initial render and observe for table content changes
    applyLabels();
    const observer = new MutationObserver(applyLabels);
    observer.observe(container, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return <div ref={ref} style={{ width: '100%', overflowX: 'auto' }}>{children}</div>;
}
