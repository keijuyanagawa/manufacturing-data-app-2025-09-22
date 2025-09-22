'use client'

import { useState, useEffect } from 'react'
import { loadData, addRecord, Record, PROCESS_LIST, CAUSE_CATEGORIES } from '@/lib/data'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Pie } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState<'input' | 'list' | 'analytics'>('input')
  const [data, setData] = useState<Record[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const result = await loadData()
      setData(result)
    }
    fetchData()
  }, [])

  const handleAddRecord = async (formData: any) => {
    const result = await addRecord(formData)
    setMessage({
      type: result.success ? 'success' : 'warning',
      text: result.message
    })
    
    // Reload data after successful addition
    if (result.success) {
      const updatedData = await loadData()
      setData(updatedData)
    }
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className="base-system min-h-screen">
      {/* Header */}
      <div className="base-header">
        <span>不良率モニタリングシステム</span>
      </div>

      {/* Navigation */}
      <div className="base-nav">
        <button
          onClick={() => setCurrentPage('input')}
          className={`base-nav-button ${currentPage === 'input' ? 'active' : ''}`}
        >
          データ入力
        </button>
        <button
          onClick={() => setCurrentPage('list')}
          className={`base-nav-button ${currentPage === 'list' ? 'active' : ''}`}
        >
          データ一覧
        </button>
        <button
          onClick={() => setCurrentPage('analytics')}
          className={`base-nav-button ${currentPage === 'analytics' ? 'active' : ''}`}
        >
          分析グラフ
        </button>
      </div>

      {/* Main Content */}
      <div className="base-container">
        {currentPage === 'input' && (
          <InputPage onAddRecord={handleAddRecord} message={message} />
        )}
        {currentPage === 'list' && (
          <ListPage data={data} />
        )}
        {currentPage === 'analytics' && (
          <AnalyticsPage data={data} />
        )}
      </div>
    </div>
  )
}

function InputPage({ onAddRecord, message }: { 
  onAddRecord: (data: any) => Promise<void>
  message: { type: 'success' | 'warning' | 'error'; text: string } | null 
}) {
  const [formData, setFormData] = useState({
    日付: new Date().toISOString().split('T')[0],
    回答者: '',
    工程名: '',
    原因カテゴリ: '',
    コメント: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.回答者.trim() || !formData.工程名) {
      await onAddRecord({ ...formData, error: '回答者と工程名は必須項目です' })
      return
    }
    await onAddRecord(formData)
    setFormData({
      日付: new Date().toISOString().split('T')[0],
      回答者: '',
      工程名: '',
      原因カテゴリ: '',
      コメント: ''
    })
  }

  return (
    <div className="base-panel">
      <h2 className="base-label">データ入力</h2>
      
      <form onSubmit={handleSubmit}>
        <table className="base-table">
          <tbody>
            <tr>
              <td className="base-label">日付</td>
              <td>
                <input
                  type="date"
                  value={formData.日付}
                  onChange={(e) => setFormData({ ...formData, 日付: e.target.value })}
                  className="base-input"
                />
              </td>
              <td className="base-label">回答者</td>
              <td>
                <input
                  type="text"
                  value={formData.回答者}
                  onChange={(e) => setFormData({ ...formData, 回答者: e.target.value })}
                  placeholder="例：田中太郎"
                  className="base-input"
                />
              </td>
            </tr>
            <tr>
              <td className="base-label">工程名</td>
              <td>
                <select
                  value={formData.工程名}
                  onChange={(e) => setFormData({ ...formData, 工程名: e.target.value })}
                  className="base-select"
                >
                  <option value="">選択してください</option>
                  {PROCESS_LIST.map(process => (
                    <option key={process} value={process}>{process}</option>
                  ))}
                </select>
              </td>
              <td className="base-label">原因カテゴリ</td>
              <td>
                <select
                  value={formData.原因カテゴリ}
                  onChange={(e) => setFormData({ ...formData, 原因カテゴリ: e.target.value })}
                  className="base-select"
                >
                  <option value="">選択してください</option>
                  {CAUSE_CATEGORIES.map(cause => (
                    <option key={cause} value={cause}>{cause}</option>
                  ))}
                </select>
              </td>
            </tr>
            <tr>
              <td className="base-label">コメント</td>
              <td colSpan={3}>
                <textarea
                  value={formData.コメント}
                  onChange={(e) => setFormData({ ...formData, コメント: e.target.value })}
                  placeholder="不良の詳細や対応策などを記入してください"
                  rows={3}
                  className="base-textarea"
                  style={{ width: '100%' }}
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <button
            type="submit"
            className="base-button base-button-primary"
          >
            データ追加
          </button>
        </div>
      </form>

      {/* Message Display */}
      {message && (
        <div className={`base-message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  )
}

function ListPage({ data }: { data: Record[] }) {
  const [filters, setFilters] = useState({
    process: '',
    cause: '',
    dateRange: '過去7日間'
  })

  const filteredData = data.filter(record => {
    if (filters.process && record.工程名 !== filters.process) return false
    if (filters.cause && record.原因カテゴリ !== filters.cause) return false
    
    const recordDate = new Date(record.日付)
    const now = new Date()
    
    if (filters.dateRange === '過去7日間') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      if (recordDate < weekAgo) return false
    } else if (filters.dateRange === '過去14日間') {
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
      if (recordDate < twoWeeksAgo) return false
    } else if (filters.dateRange === '過去30日間') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      if (recordDate < monthAgo) return false
    }
    
    return true
  })

  return (
    <div className="base-panel">
      <h2 className="base-label">データ一覧</h2>
      
      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666666' }}>
          表示するデータがありません
        </div>
      ) : (
        <>
          {/* Filters */}
          <table className="base-table" style={{ marginBottom: '8px' }}>
            <tbody>
              <tr>
                <td className="base-label">工程フィルタ</td>
                <td>
                  <select
                    value={filters.process}
                    onChange={(e) => setFilters({ ...filters, process: e.target.value })}
                    className="base-select"
                  >
                    <option value="">全て</option>
                    {PROCESS_LIST.map(process => (
                      <option key={process} value={process}>{process}</option>
                    ))}
                  </select>
                </td>
                <td className="base-label">原因カテゴリフィルタ</td>
                <td>
                  <select
                    value={filters.cause}
                    onChange={(e) => setFilters({ ...filters, cause: e.target.value })}
                    className="base-select"
                  >
                    <option value="">全て</option>
                    {CAUSE_CATEGORIES.map(cause => (
                      <option key={cause} value={cause}>{cause}</option>
                    ))}
                  </select>
                </td>
                <td className="base-label">期間フィルタ</td>
                <td>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                    className="base-select"
                  >
                    <option value="過去7日間">過去7日間</option>
                    <option value="過去14日間">過去14日間</option>
                    <option value="過去30日間">過去30日間</option>
                    <option value="全期間">全期間</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Data Table */}
          <table className="base-table">
            <thead>
              <tr>
                <th>日付</th>
                <th>回答者</th>
                <th>工程名</th>
                <th>原因カテゴリ</th>
                <th>コメント</th>
              </tr>
            </thead>
            <tbody>
              {filteredData
                .sort((a, b) => {
                  // 日付で降順ソート（最新順）
                  const dateA = new Date(a.日付);
                  const dateB = new Date(b.日付);
                  return dateB.getTime() - dateA.getTime();
                })
                .map((record) => (
                  <tr key={record.id}>
                    <td>{record.日付}</td>
                    <td>{record.回答者}</td>
                    <td>{record.工程名}</td>
                    <td>{record.原因カテゴリ}</td>
                    <td>{record.コメント}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          
          <div style={{ marginTop: '8px', fontSize: '11px', color: '#666666' }}>
            表示件数: {filteredData.length}件
          </div>
        </>
      )}
    </div>
  )
}

function AnalyticsPage({ data }: { data: Record[] }) {
  const [selectedPeriod, setSelectedPeriod] = useState('過去7日間')
  
  const periodDays = {
    '過去7日間': 7,
    '過去14日間': 14,
    '過去30日間': 30,
    '全期間': 365
  }

  const filteredData = data.filter(record => {
    const recordDate = new Date(record.日付)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - periodDays[selectedPeriod as keyof typeof periodDays])
    return recordDate >= cutoffDate
  })

  // Calculate metrics
  const totalCount = data.length
  const todayCount = data.filter(r => r.日付 === new Date().toISOString().split('T')[0]).length
  const weekCount = filteredData.length

  return (
    <div className="base-panel">
      <h2 className="base-label">分析グラフ</h2>
      
      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666666' }}>
          グラフを表示するデータがありません
        </div>
      ) : (
        <>
          {/* Metrics */}
          <table className="base-table" style={{ marginBottom: '8px' }}>
            <tbody>
              <tr>
                <td className="base-label">総件数</td>
                <td style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                  {totalCount}
                </td>
                <td className="base-label">今日の件数</td>
                <td style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                  {todayCount}
                </td>
                <td className="base-label">直近7日間</td>
                <td style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                  {weekCount}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Period Selection */}
          <table className="base-table" style={{ marginBottom: '8px' }}>
            <tbody>
              <tr>
                <td className="base-label">分析期間を選択</td>
                <td>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="base-select"
                  >
                    {Object.keys(periodDays).map(period => (
                      <option key={period} value={period}>{period}</option>
                    ))}
                  </select>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Charts */}
          <div style={{ marginTop: '8px' }}>
            {/* 日付別発生件数グラフ */}
            <div className="base-panel" style={{ marginBottom: '8px' }}>
              <div className="base-label" style={{ marginBottom: '8px' }}>日付別発生件数グラフ</div>
              <div style={{ height: '300px', width: '100%' }}>
                <Bar data={getDailyChartData(filteredData)} options={getBarChartOptions()} />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: '1', minWidth: '0' }}>
                <div className="base-panel">
                  <div className="base-label" style={{ marginBottom: '8px' }}>工程別発生件数</div>
                  <div style={{ height: '250px', width: '100%' }}>
                    <Bar data={getProcessChartData(filteredData)} options={getHorizontalBarChartOptions()} />
                  </div>
                </div>
              </div>
              <div style={{ flex: '1', minWidth: '0' }}>
                <div className="base-panel">
                  <div className="base-label" style={{ marginBottom: '8px' }}>原因カテゴリ別割合</div>
                  <div style={{ height: '250px', width: '100%' }}>
                    <Pie data={getCauseChartData(filteredData)} options={getPieChartOptions()} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Chart.js用のデータ生成関数
function getDailyChartData(data: Record[]) {
  const dailyCounts: { [key: string]: number } = {}
  
  data.forEach(record => {
    const date = record.日付
    dailyCounts[date] = (dailyCounts[date] || 0) + 1
  })
  
  const sortedData = Object.entries(dailyCounts)
    .map(([日付, 件数]) => ({ 日付, 件数 }))
    .sort((a, b) => a.日付.localeCompare(b.日付))
  
  return {
    labels: sortedData.map(item => item.日付),
    datasets: [{
      label: '件数',
      data: sortedData.map(item => item.件数),
      backgroundColor: '#4A90E2',
      borderColor: '#357ABD',
      borderWidth: 1
    }]
  }
}

function getProcessChartData(data: Record[]) {
  const processCounts: { [key: string]: number } = {}
  
  data.forEach(record => {
    const process = record.工程名
    if (process) {
      processCounts[process] = (processCounts[process] || 0) + 1
    }
  })
  
  const sortedData = Object.entries(processCounts)
    .map(([工程名, 件数]) => ({ 工程名, 件数 }))
    .sort((a, b) => b.件数 - a.件数)
  
  return {
    labels: sortedData.map(item => item.工程名),
    datasets: [{
      label: '件数',
      data: sortedData.map(item => item.件数),
      backgroundColor: '#4A90E2',
      borderColor: '#357ABD',
      borderWidth: 1
    }]
  }
}

function getCauseChartData(data: Record[]) {
  const causeCounts: { [key: string]: number } = {}
  
  data.forEach(record => {
    const cause = record.原因カテゴリ
    causeCounts[cause] = (causeCounts[cause] || 0) + 1
  })
  
  const sortedData = Object.entries(causeCounts)
    .map(([原因カテゴリ, 件数]) => ({ 原因カテゴリ, 件数 }))
    .sort((a, b) => b.件数 - a.件数)
  
  return {
    labels: sortedData.map(item => item.原因カテゴリ),
    datasets: [{
      data: sortedData.map(item => item.件数),
      backgroundColor: getLegacyPieColors().slice(0, sortedData.length),
      borderColor: '#999999',
      borderWidth: 1
    }]
  }
}

// Chart.js用のオプション設定（基幹システム風）
function getBarChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#F0F0F0',
        titleColor: '#333333',
        bodyColor: '#333333',
        borderColor: '#CCCCCC',
        borderWidth: 1,
        titleFont: {
          family: 'MS Gothic, Courier New, monospace',
          size: 11
        },
        bodyFont: {
          family: 'MS Gothic, Courier New, monospace',
          size: 11
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: '#CCCCCC',
          lineWidth: 1
        },
        ticks: {
          color: '#333333',
          font: {
            family: 'MS Gothic, Courier New, monospace',
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: '#CCCCCC',
          lineWidth: 1
        },
        ticks: {
          color: '#333333',
          font: {
            family: 'MS Gothic, Courier New, monospace',
            size: 11
          },
          stepSize: 1,
          callback: function(value: any) {
            return Number.isInteger(value) ? value : '';
          }
        }
      }
    }
  }
}

function getHorizontalBarChartOptions() {
  return {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#F0F0F0',
        titleColor: '#333333',
        bodyColor: '#333333',
        borderColor: '#CCCCCC',
        borderWidth: 1,
        titleFont: {
          family: 'MS Gothic, Courier New, monospace',
          size: 11
        },
        bodyFont: {
          family: 'MS Gothic, Courier New, monospace',
          size: 11
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: '#CCCCCC',
          lineWidth: 1
        },
        ticks: {
          color: '#333333',
          font: {
            family: 'MS Gothic, Courier New, monospace',
            size: 11
          },
          stepSize: 1,
          callback: function(value: any) {
            return Number.isInteger(value) ? value : '';
          }
        }
      },
      y: {
        grid: {
          color: '#CCCCCC',
          lineWidth: 1
        },
        ticks: {
          color: '#333333',
          font: {
            family: 'MS Gothic, Courier New, monospace',
            size: 11
          }
        }
      }
    }
  }
}

function getPieChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#333333',
          font: {
            family: 'MS Gothic, Courier New, monospace',
            size: 11
          },
          usePointStyle: true,
          pointStyle: 'rect',
          generateLabels: function(chart: any) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              const dataset = data.datasets[0];
              const total = dataset.data.reduce((a: number, b: number) => a + b, 0);
              return data.labels.map((label: string, index: number) => {
                const value = dataset.data[index];
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: dataset.backgroundColor[index],
                  strokeStyle: dataset.borderColor,
                  lineWidth: dataset.borderWidth,
                  pointStyle: 'rect',
                  hidden: false,
                  index: index
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: '#F0F0F0',
        titleColor: '#333333',
        bodyColor: '#333333',
        borderColor: '#CCCCCC',
        borderWidth: 1,
        titleFont: {
          family: 'MS Gothic, Courier New, monospace',
          size: 11
        },
        bodyFont: {
          family: 'MS Gothic, Courier New, monospace',
          size: 11
        },
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${label}: ${value}件 (${percentage}%)`;
          }
        }
      }
    }
  }
}

function getLegacyPieColors() {
  // 基幹システム風の色調（白背景で視認性の良い色）
  return [
    '#4A90E2', // 青
    '#7ED321', // 緑
    '#F5A623', // オレンジ
    '#D0021B', // 赤
    '#9013FE', // 紫
    '#50E3C2', // ティール
    '#B8E986', // 薄緑
    '#FF6B6B', // ピンク
    '#4ECDC4', // ターコイズ
    '#45B7D1'  // スカイブルー
  ]
}