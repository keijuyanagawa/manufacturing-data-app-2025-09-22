import { supabase } from './supabase'

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

export async function loadData(): Promise<Record[]> {
  try {
    const { data, error } = await supabase
      .from('manufacturing_records')
      .select('*')
      .order('date', { ascending: false })
    
    if (error) {
      console.error('Failed to load data:', error)
      return []
    }
    
    // Convert database format to UI format
    return data.map(record => ({
      id: record.id,
      日付: record.date,
      回答者: record.respondent,
      工程名: record.process_name,
      原因カテゴリ: record.cause_category,
      コメント: record.comment
    }))
  } catch (e) {
    console.error('Failed to load data:', e)
    return []
  }
}

export async function addRecord(record: Omit<Record, 'id'>): Promise<{ success: boolean; message: string }> {
  try {
    // Check for duplicates
    const { data: existingData, error: searchError } = await supabase
      .from('manufacturing_records')
      .select('*')
      .eq('date', record.日付)
      .eq('respondent', record.回答者)
      .eq('process_name', record.工程名)
      .eq('cause_category', record.原因カテゴリ)
      .eq('comment', record.コメント)
    
    if (searchError) {
      console.error('Failed to search for duplicates:', searchError)
      return { success: false, message: 'データの確認中にエラーが発生しました。' }
    }
    
    if (existingData && existingData.length > 0) {
      return { success: false, message: '同じ内容のレコードが既に存在します。内容を確認してください。' }
    }
    
    // Insert new record
    const { error } = await supabase
      .from('manufacturing_records')
      .insert([{
        date: record.日付,
        respondent: record.回答者,
        process_name: record.工程名,
        cause_category: record.原因カテゴリ,
        comment: record.コメント
      }])
    
    if (error) {
      console.error('Failed to add record:', error)
      return { success: false, message: 'データの追加中にエラーが発生しました。' }
    }
    
    return { success: true, message: 'データが正常に追加されました。' }
  } catch (e) {
    console.error('Failed to add record:', e)
    return { success: false, message: 'データの追加中にエラーが発生しました。' }
  }
}