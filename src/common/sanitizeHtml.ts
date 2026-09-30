import DOMPurify from "dompurify";

export const sanitizeHtml = (html: string): string => DOMPurify.sanitize(html);
