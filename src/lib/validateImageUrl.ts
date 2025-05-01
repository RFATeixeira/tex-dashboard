// src/utils/validateImageUrl.ts
export function validateImageUrl(url: string): boolean {
    return /\.(jpeg|jpg|png|gif)$/i.test(url);
  }