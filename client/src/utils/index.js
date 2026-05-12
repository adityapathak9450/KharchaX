import dayjs from 'dayjs'

export function formatDate(value, format = 'MMM D, YYYY') {
  if (!value) return ''
  return dayjs(value).format(format)
}
