export interface Record {
  id: string
  日付: string
  回答者: string
  工程名: string
  原因カテゴリ: string
  コメント: string
}

export const PROCESS_LIST = [
  "材料準備工程",
  "加熱工程", 
  "押出成形工程",
  "冷却工程",
  "引取工程",
  "矯正工程",
  "切断工程",
  "品質検査工程",
  "表面処理工程",
  "梱包工程"
]

export const CAUSE_CATEGORIES = [
  "設備不良",
  "材料不良",
  "作業ミス", 
  "手順起因",
  "環境要因",
  "測定器具",
  "その他"
]

const STORAGE_KEY = 'manufacturing_data'

export function loadData(): Record[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load data:', e)
  }
  
  // Generate initial sample data (past 2 months)
  const sampleData = generateSampleData()
  saveData(sampleData)
  return sampleData
}

export function saveData(data: Record[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save data:', e)
  }
}

export function addRecord(record: Omit<Record, 'id'>): { success: boolean; message: string } {
  const data = loadData()
  
  // Check for duplicates
  const duplicate = data.find(r => 
    r.日付 === record.日付 &&
    r.回答者 === record.回答者 &&
    r.工程名 === record.工程名 &&
    r.原因カテゴリ === record.原因カテゴリ &&
    r.コメント === record.コメント
  )
  
  if (duplicate) {
    return { success: false, message: '同じ内容のレコードが既に存在します。内容を確認してください。' }
  }
  
  const newRecord: Record = {
    ...record,
    id: Date.now().toString()
  }
  
  data.push(newRecord)
  saveData(data)
  
  return { success: true, message: 'データが正常に追加されました。' }
}

function generateSampleData(): Record[] {
  const data: Record[] = []
  const respondents = ['田中', '佐藤', '高橋', '山田', '渡辺']
  
  // Generate data for past 60 days
  for (let i = 60; i >= 1; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    // 2-6 records per day
    const recordCount = Math.floor(Math.random() * 5) + 2
    
    for (let j = 0; j < recordCount; j++) {
      const process = PROCESS_LIST[Math.floor(Math.random() * PROCESS_LIST.length)]
      const cause = CAUSE_CATEGORIES[Math.floor(Math.random() * CAUSE_CATEGORIES.length)]
      
      data.push({
        id: `${dateStr}_${j}`,
        日付: dateStr,
        回答者: respondents[Math.floor(Math.random() * respondents.length)],
        工程名: process,
        原因カテゴリ: cause,
        コメント: `サンプル_${Math.floor(Math.random() * 999)}`
      })
    }
  }
  
  // デバッグ用ログ
  console.log('Generated sample data:', data.length, 'records')
  console.log('Process distribution:', data.reduce((acc, record) => {
    acc[record.工程名] = (acc[record.工程名] || 0) + 1
    return acc
  }, {} as { [key: string]: number }))
  
  return data
}