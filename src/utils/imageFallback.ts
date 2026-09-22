import type { SyntheticEvent } from 'react';

/** onError cho <img>: đổi sang ảnh dự phòng đúng một lần, tránh vòng lặp request khi ảnh dự phòng cũng lỗi. */
export const fallbackTo = (url: string) => (e: SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (img.dataset.fallback) return;
  img.dataset.fallback = '1';
  img.src = url;
};
