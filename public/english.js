export function displayScene(scene) {
  return String(scene).replace(/女性/g,'Female').replace(/男性/g,'Male').replace(/臉部特寫/g,'Face close-up').replace(/半身人像/g,'Half body').replace(/全身人像/g,'Full body').replace(/乾淨背景/g,'Clean background').replace(/有場景/g,'In a setting').replace(/(\d+) 歲/g,'$1 years');
}
export function uiError(message) {
  const text=String(message||'');
  const map={
    '請先輸入需求或名字。':'Enter a request or a name first.',
    '張數請填 1–100 張。':'Enter an image count from 1 to 100.',
    '請填有效的年齡區間。':'Enter a valid age range.',
    '請選擇背景、性別與取景。':'Choose a background, gender, and framing.',
    '請先設定個人 API Key':'Set your personal API key first.',
    '請先在連線設定輸入個人 API Key，或改用模擬模式。':'Enter your API key in connection settings, or use the ChatGPT copy workflow.',
    '上一批仍在生成，完成後就能開始下一批。':'The previous batch is still generating. Wait for it to finish.',
    '公司生成額度不足，請聯絡管理員。':'Your company image allowance is insufficient. Contact your administrator.',
    '請先登入公司帳號。':'Sign in to your company account first.',
    '帳號或密碼錯誤':'Incorrect username or password.',
    '登入嘗試過多，請 10 分鐘後重試':'Too many sign-in attempts. Try again in 10 minutes.',
    '請輸入有效 API Key':'Enter a valid API key.',
    '此來源尚未啟用':'This generation method is not available.',
    '需要管理員權限':'Administrator access is required.',
    '帳號或額度無效':'Invalid account or allowance.',
    '沒有可生成的素材':'No images are available to generate.',
    'Prompt 不可為空白':'The prompt cannot be empty.',
    '素材不存在或正在生成':'This image is unavailable or still generating.',
    '僅支援 PNG、JPEG、WebP':'Only PNG, JPEG, and WebP images are supported.',
    '圖片上限 10 MB':'Images must be 10 MB or smaller.',
    '上傳大小上限為 10 MB':'Upload size cannot exceed 10 MB.',
    '素材不存在':'Image not found.',
    '版本不存在':'Version not found.',
    '目前已累積 500 張素材，請先到進階管理整理舊素材。':'You have reached 500 images. Manage older images in Advanced settings first.',
    '個人 Key 已過期或已刪除，請重新設定。':'Your API key is no longer available. Enter it again.',
    'API 未回傳可用圖片':'The API did not return a usable image.',
    'API 請求逾時；可能已計費，請先檢查供應商紀錄再重試。':'The API request timed out and may have been billed. Check provider records before retrying.',
    'API 連線失敗；請檢查網路，確認帳務後再重試。':'The API connection failed. Check your network and billing records before retrying.',
    '服務重新啟動；請檢查供應商帳務後手動重試，避免重複扣費。':'The server restarted. Check provider billing before retrying to avoid duplicate charges.'
  };
  if(map[text])return map[text];
  const status=/OpenAI 回應 (\d+)/.exec(text);
  if(status)return `OpenAI returned HTTP ${status[1]}. Check your balance, model, and image size. No automatic retry was made.`;
  if(/[\u3400-\u9fff]/.test(text))return 'The request could not be completed. Check your settings and try again.';
  return text;
}
