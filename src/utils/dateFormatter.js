/**
 * Format ISO date string or Date object to human-readable format
 * @param {string|Date} date - Date to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (Number.isNaN(dateObj.getTime())) {
      return String(date);
    }

    const {
      includeTime = true,
      includeDate = true,
      includeYear = true,
      format = 'default',
    } = options;

    // Short format: "Apr 23, 7:30 PM"
    if (format === 'short') {
      const dateStr = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const timeStr = dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return `${dateStr}, ${timeStr}`;
    }

    // Long format: "Thursday, April 23, 2026 at 7:30 PM"
    if (format === 'long') {
      const dateStr = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const timeStr = dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return `${dateStr} at ${timeStr}`;
    }

    // Time only: "7:30 PM"
    if (format === 'time') {
      return dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    // Date only: "Apr 23, 2026"
    if (format === 'date') {
      return dateObj.toLocaleDateString('en-US', {
        year: includeYear ? 'numeric' : undefined,
        month: 'short',
        day: 'numeric',
      });
    }

    // Default format: "Apr 23, 2026 • 7:30 PM"
    const dateParts = [];
    
    if (includeDate) {
      dateParts.push(dateObj.toLocaleDateString('en-US', {
        year: includeYear ? 'numeric' : undefined,
        month: 'short',
        day: 'numeric',
      }));
    }

    if (includeTime) {
      dateParts.push(dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }));
    }

    return dateParts.join(' • ');
  } catch {
    return String(date);
  }
};

/**
 * Format date relative to now (e.g., "2 hours ago", "in 3 days")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (Number.isNaN(dateObj.getTime())) {
      return String(date);
    }

    const now = new Date();
    const diffMs = dateObj.getTime() - now.getTime();
    const diffSec = Math.floor(Math.abs(diffMs) / 1000);
    const isPast = diffMs < 0;

    // Less than a minute
    if (diffSec < 60) {
      return isPast ? 'just now' : 'in a moment';
    }

    // Less than an hour
    if (diffSec < 3600) {
      const minutes = Math.floor(diffSec / 60);
      return isPast 
        ? `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
        : `in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    // Less than a day
    if (diffSec < 86400) {
      const hours = Math.floor(diffSec / 3600);
      return isPast
        ? `${hours} hour${hours !== 1 ? 's' : ''} ago`
        : `in ${hours} hour${hours !== 1 ? 's' : ''}`;
    }

    // Less than a week
    if (diffSec < 604800) {
      const days = Math.floor(diffSec / 86400);
      return isPast
        ? `${days} day${days !== 1 ? 's' : ''} ago`
        : `in ${days} day${days !== 1 ? 's' : ''}`;
    }

    // Fall back to formatted date
    return formatDate(dateObj, { format: 'short' });
  } catch {
    return String(date);
  }
};
