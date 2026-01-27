import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

export function formatDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function truncate(str, length = 100) {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

export function getPriorityColor(priority) {
  switch (priority) {
    case 'CRITICAL':
      return 'text-red-600 bg-red-50';
    case 'HIGH':
      return 'text-orange-600 bg-orange-50';
    case 'NORMAL':
      return 'text-blue-600 bg-blue-50';
    case 'LOW':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getHealthColor(health) {
  switch (health) {
    case 'ON_TRACK':
      return 'text-green-600 bg-green-50';
    case 'NEEDS_ATTENTION':
      return 'text-yellow-600 bg-yellow-50';
    case 'AT_RISK':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getStatusColor(status) {
  switch (status) {
    case 'OPEN':
      return 'text-blue-600 bg-blue-50';
    case 'AWAITING_RESPONSE':
      return 'text-orange-600 bg-orange-50';
    case 'RESOLVED':
      return 'text-green-600 bg-green-50';
    case 'SNOOZED':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getSentimentIcon(sentiment) {
  switch (sentiment) {
    case 'happy':
      return '😊';
    case 'frustrated':
      return '😤';
    case 'anxious':
      return '😰';
    case 'confused':
      return '😕';
    default:
      return '😐';
  }
}
