import { bucketLabels, bucketOrder } from '../constants'
import type { Bucket, InboxData, UiState } from '../types'

interface SidebarProps {
  queues: InboxData
  selectedBucket: Bucket
  onBucketChange: (bucket: Bucket) => void
  onSetUiState: (state: UiState) => void
  onRefresh: () => void
}

export function Sidebar({
  queues,
  selectedBucket,
  onBucketChange,
  onRefresh,
  onSetUiState,
}: SidebarProps) {
  return (
    <aside className="panel sidebar-panel" aria-label="Queues">
      <div className="panel-heading">
        <h2>Queues</h2>
        <p>Three buckets. Nothing more.</p>
      </div>
      <div className="queue-list">
        {bucketOrder.map((bucket) => {
          const count = queues[bucket].length
          const isActive = bucket === selectedBucket

          return (
            <button
              key={bucket}
              type="button"
              className={`queue-item${isActive ? ' is-active' : ''}`}
              onClick={() => onBucketChange(bucket)}
            >
              <span>{bucketLabels[bucket]}</span>
              <span>{count}</span>
            </button>
          )
        })}
      </div>
      <div className="sidebar-footnote">
        <p>Connected to Gmail</p>
        <p>Last ingest 6 minutes ago</p>
      </div>
      <div className="sidebar-preview">
        <p className="section-label">Preview States</p>
        <div className="preview-actions">
          <button type="button" className="text-button" onClick={() => onSetUiState('ready')}>
            Ready
          </button>
          <button type="button" className="text-button" onClick={onRefresh}>
            Syncing
          </button>
          <button type="button" className="text-button" onClick={() => onSetUiState('auth_expired')}>
            Reconnect
          </button>
          <button type="button" className="text-button" onClick={() => onSetUiState('error')}>
            Error
          </button>
        </div>
      </div>
    </aside>
  )
}
