import { useEffect } from 'react';

/**
 * Contre-audit 15 Sep 2026, L01 (mobile pass): the mobile filter drawers on
 * AppelsPage/MarchesPublicsPage/SousTraitancePage ("fixed inset-0 ... pt-10
 * md:hidden") had no body-scroll-lock, so the page underneath kept scrolling
 * while the drawer was open on a touch device - the backdrop covers the
 * viewport, but a finger drag still scrolls the (invisible, fixed-under-it)
 * page content, which then jumps when the drawer closes. AppointmentModal
 * already solved this correctly (fixed-position + scrollY offset technique,
 * so the page doesn't visibly jump on open/close) - this hook is that same
 * logic, extracted so the filter drawers get the identical fix instead of a
 * second hand-rolled copy.
 *
 * Not verified on a real device from this environment (no phone/emulator
 * available here) - reviewed against the working AppointmentModal
 * implementation and tsc-clean, but genuinely needs a real mobile pass like
 * the rest of L01.
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const { overflow, position, top, width } = document.body.style;
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.position = position;
      document.body.style.top = top;
      document.body.style.width = width;
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}
