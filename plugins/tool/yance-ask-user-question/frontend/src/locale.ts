const en = {
  title: "Your input is needed",
  previous: "Previous question",
  next: "Next question",
  submit: "Submit answer",
  deny: "Deny",
  other: "Other — type your answer",
  recommended: "Recommended",
  progress: "{current} / {total}",
  remaining: "{seconds}s remaining",
  timedOut: "This question has expired. Ask your agent to try again.",
  invalid: "The question cannot be displayed. You can decline to answer.",
  authError:
    "You are not allowed to answer this request. Check your sign-in and agent.",
  staleError: "This request has expired or was already resolved.",
  invalidAnswer:
    "The answer was not accepted. Review every question and try again.",
  submitError:
    "Could not submit your answer. Your choices have been kept; please try again.",
  preview: "Option preview",
  tool: "Tool",
  source: "Source",
  severity: "Severity",
  findings: "Findings",
  parameters: "Parameters",
  details: "Details",
  agent: "Agent",
  pluginSource: "Plugin",
  version: "Version",
  author: "Author",
  contact: "Contact",
};

export type MessageKey = keyof typeof en;
type Messages = Record<MessageKey, string>;

export const messages: Record<string, Messages> = {
  en,
  zh: {
    title: "需要你补充信息",
    previous: "上一题",
    next: "下一题",
    submit: "提交答案",
    deny: "拒绝",
    other: "其他：输入你的答案",
    recommended: "推荐",
    progress: "{current} / {total}",
    remaining: "剩余 {seconds} 秒",
    timedOut: "问题已超时，请让 Agent 重新提问。",
    invalid: "无法显示此问题，你可以拒绝回答。",
    authError: "你无权回答此请求，请检查登录状态和 Agent。",
    staleError: "请求已超时或已处理。",
    invalidAnswer: "答案未被接受，请检查每道题后重试。",
    submitError: "提交失败，已保留你的答案，请重试。",
    preview: "选项预览",
    tool: "工具",
    source: "来源",
    severity: "严重性",
    findings: "发现",
    parameters: "参数",
    details: "详细信息",
    agent: "Agent",
    pluginSource: "插件",
    version: "版本",
    author: "作者",
    contact: "联系邮箱",
  },
  id: {
    title: "Masukan Anda diperlukan",
    previous: "Pertanyaan sebelumnya",
    next: "Pertanyaan berikutnya",
    submit: "Kirim jawaban",
    deny: "Tolak",
    other: "Lainnya — ketik jawaban Anda",
    recommended: "Direkomendasikan",
    progress: "{current} / {total}",
    remaining: "Tersisa {seconds} dtk",
    timedOut: "Pertanyaan ini telah kedaluwarsa. Minta agen Anda mencoba lagi.",
    invalid: "Pertanyaan tidak dapat ditampilkan. Anda dapat menolak menjawab.",
    authError:
      "Anda tidak diizinkan menjawab permintaan ini. Periksa login dan agen Anda.",
    staleError: "Permintaan ini telah kedaluwarsa atau diselesaikan.",
    invalidAnswer:
      "Jawaban tidak diterima. Periksa setiap pertanyaan dan coba lagi.",
    submitError:
      "Jawaban tidak dapat dikirim. Pilihan Anda disimpan; coba lagi.",
    preview: "Pratinjau opsi",
    tool: "Alat",
    source: "Sumber",
    severity: "Tingkat Keparahan",
    findings: "Temuan",
    parameters: "Parameter",
    details: "Detail",
    agent: "Agen",
    pluginSource: "Plugin",
    version: "Versi",
    author: "Penulis",
    contact: "Kontak",
  },
  ja: {
    title: "追加情報が必要です",
    previous: "前の質問",
    next: "次の質問",
    submit: "回答を送信",
    deny: "拒否",
    other: "その他 — 回答を入力",
    recommended: "推奨",
    progress: "{current} / {total}",
    remaining: "残り {seconds} 秒",
    timedOut:
      "質問の有効期限が切れました。エージェントに再度質問を依頼してください。",
    invalid: "質問を表示できません。回答を辞退できます。",
    authError:
      "このリクエストに回答する権限がありません。ログイン状態とエージェントを確認してください。",
    staleError: "このリクエストは期限切れか、処理済みです。",
    invalidAnswer:
      "回答が受け付けられませんでした。すべての質問を確認して再試行してください。",
    submitError:
      "送信できませんでした。回答は保存されています。再試行してください。",
    preview: "選択肢のプレビュー",
    tool: "ツール",
    source: "ソース",
    severity: "重要度",
    findings: "検出件数",
    parameters: "パラメータ",
    details: "詳細",
    agent: "エージェント",
    pluginSource: "プラグイン",
    version: "バージョン",
    author: "作者",
    contact: "連絡先",
  },
  "pt-BR": {
    title: "Precisamos da sua resposta",
    previous: "Pergunta anterior",
    next: "Próxima pergunta",
    submit: "Enviar resposta",
    deny: "Recusar",
    other: "Outra opção — digite sua resposta",
    recommended: "Recomendado",
    progress: "{current} / {total}",
    remaining: "Restam {seconds}s",
    timedOut: "Esta pergunta expirou. Peça ao agente para tentar novamente.",
    invalid:
      "Não foi possível exibir a pergunta. Você pode recusar a resposta.",
    authError:
      "Você não tem permissão para responder. Verifique seu login e agente.",
    staleError: "Esta solicitação expirou ou já foi resolvida.",
    invalidAnswer:
      "A resposta não foi aceita. Revise todas as perguntas e tente novamente.",
    submitError:
      "Não foi possível enviar. Suas escolhas foram mantidas; tente novamente.",
    preview: "Prévia da opção",
    tool: "Ferramenta",
    source: "Origem",
    severity: "Gravidade",
    findings: "Ocorrências",
    parameters: "Parâmetros",
    details: "Detalhes",
    agent: "Agente",
    pluginSource: "Plugin",
    version: "Versão",
    author: "Autor",
    contact: "Contato",
  },
  ru: {
    title: "Нужен ваш ответ",
    previous: "Предыдущий вопрос",
    next: "Следующий вопрос",
    submit: "Отправить ответ",
    deny: "Отклонить",
    other: "Другое — введите ответ",
    recommended: "Рекомендуется",
    progress: "{current} / {total}",
    remaining: "Осталось {seconds} с",
    timedOut: "Срок ответа истёк. Попросите агента задать вопрос снова.",
    invalid: "Не удалось показать вопрос. Вы можете отказаться от ответа.",
    authError:
      "У вас нет права ответить. Проверьте вход в систему и выбранного агента.",
    staleError: "Срок запроса истёк или он уже обработан.",
    invalidAnswer:
      "Ответ не принят. Проверьте все вопросы и повторите попытку.",
    submitError:
      "Не удалось отправить ответ. Ваш выбор сохранён; попробуйте снова.",
    preview: "Предпросмотр варианта",
    tool: "Инструмент",
    source: "Источник",
    severity: "Уровень угрозы",
    findings: "Находки",
    parameters: "Параметры",
    details: "Подробности",
    agent: "Агент",
    pluginSource: "Плагин",
    version: "Версия",
    author: "Автор",
    contact: "Контакт",
  },
  vi: {
    title: "Cần bạn cung cấp thêm thông tin",
    previous: "Câu hỏi trước",
    next: "Câu hỏi tiếp theo",
    submit: "Gửi câu trả lời",
    deny: "Từ chối",
    other: "Khác — nhập câu trả lời",
    recommended: "Khuyên dùng",
    progress: "{current} / {total}",
    remaining: "Còn {seconds} giây",
    timedOut: "Câu hỏi đã hết hạn. Hãy yêu cầu tác nhân hỏi lại.",
    invalid: "Không thể hiển thị câu hỏi. Bạn có thể từ chối trả lời.",
    authError:
      "Bạn không có quyền trả lời yêu cầu này. Hãy kiểm tra đăng nhập và tác nhân.",
    staleError: "Yêu cầu đã hết hạn hoặc đã được xử lý.",
    invalidAnswer:
      "Câu trả lời không được chấp nhận. Hãy kiểm tra từng câu hỏi rồi thử lại.",
    submitError:
      "Không thể gửi. Lựa chọn của bạn đã được giữ lại; hãy thử lại.",
    preview: "Xem trước tùy chọn",
    tool: "Công cụ",
    source: "Nguồn",
    severity: "Mức Độ Nghiêm Trọng",
    findings: "Phát Hiện",
    parameters: "Tham Số",
    details: "Chi tiết",
    agent: "Tác nhân",
    pluginSource: "Tiện ích",
    version: "Phiên bản",
    author: "Tác giả",
    contact: "Liên hệ",
  },
};

export function resolveLocale(locale: string): string {
  const normalized = locale.toLowerCase().replace(/_/g, "-");
  const locales = Object.keys(messages);
  const exact = locales.find((key) => key.toLowerCase() === normalized);
  if (exact) return exact;
  const prefix = normalized.split("-")[0];
  return (
    locales.find((key) => key.toLowerCase().split("-")[0] === prefix) ?? "en"
  );
}

export function translate(
  locale: string,
  key: MessageKey,
  values: Record<string, string | number> = {},
): string {
  return messages[resolveLocale(locale)][key].replace(
    /\{(\w+)\}/g,
    (match, name: string) => String(values[name] ?? match),
  );
}
