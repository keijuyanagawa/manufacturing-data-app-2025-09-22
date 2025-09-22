const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const PROCESS_LIST = [
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

const CAUSE_CATEGORIES = [
  "設備不良",
  "材料不良",
  "作業ミス", 
  "手順起因",
  "環境要因",
  "測定器具",
  "その他"
]

async function generateSampleData() {
  const data = []
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
        date: dateStr,
        respondent: respondents[Math.floor(Math.random() * respondents.length)],
        process_name: process,
        cause_category: cause,
        comment: `サンプル_${Math.floor(Math.random() * 999)}`
      })
    }
  }
  
  return data
}

async function seedData() {
  try {
    console.log('ダミーデータを生成中...')
    const sampleData = await generateSampleData()
    console.log(`${sampleData.length}件のレコードを生成しました`)
    
    console.log('Supabaseにデータを投入中...')
    const { data, error } = await supabase
      .from('manufacturing_records')
      .insert(sampleData)
    
    if (error) {
      console.error('データ投入エラー:', error)
      return
    }
    
    console.log('データ投入が完了しました！')
    console.log('Process distribution:', sampleData.reduce((acc, record) => {
      acc[record.process_name] = (acc[record.process_name] || 0) + 1
      return acc
    }, {}))
    
  } catch (error) {
    console.error('エラーが発生しました:', error)
  }
}

seedData()
