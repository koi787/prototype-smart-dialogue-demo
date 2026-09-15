import { structuredContentLabels, type StructuredContent } from '../types/record'

export function StructuredContentList({ content }: { content: StructuredContent }) {
  return (
    <div className="structured-list">
      {structuredContentLabels.map(({ key, label }) => (
        <article className="structured-card" key={key}>
          <div className="structured-card__heading">
            <span className="module-dot" aria-hidden="true" />
            <h3>{label}</h3>
          </div>
          <p>{content[key] || '未提及'}</p>
        </article>
      ))}
    </div>
  )
}
