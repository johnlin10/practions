import { useEffect } from 'react'

/** 進入頁面時設定標題與描述，離開時還原。 */
export function usePageMeta(title: string, description: string): void {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    )
    const prevTitle = document.title
    const prevDescription = meta?.content
    document.title = title
    if (meta) meta.content = description
    return () => {
      document.title = prevTitle
      if (meta && prevDescription !== undefined) meta.content = prevDescription
    }
  }, [title, description])
}
