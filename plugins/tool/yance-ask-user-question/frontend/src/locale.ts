const syncMessages = {
  en: {
    syncSettings: "Question tool settings",
    syncCaution:
      "Sync only this tool’s description for the selected Agent. All tool switches and configuration are preserved. The Agent is not reloaded.",
    syncCurrent: "Current tool description",
    syncTarget: "Chinese description to apply",
    syncAction: "Sync Chinese description",
    syncRefresh: "Refresh",
    syncLoading: "Loading…",
    syncAlready: "The Chinese description is already up to date.",
    syncSuccess: "The Chinese description was saved and verified.",
    syncChanged:
      "The tool description changed. Refresh and review before trying again.",
    syncAgentChanged:
      "The selected Agent changed. No further requests were sent.",
    syncMissingTool:
      "This Agent does not have a readable configuration for this plugin tool.",
    syncReadError:
      "Could not read this tool’s description. No update was sent.",
    syncWriteError:
      "The update failed. Refresh to check the current configuration before trying again.",
    syncVerifyError:
      "The update could not be verified. Refresh and inspect the configuration; no automatic rollback was attempted.",
    syncAuthError:
      "You are not allowed to read or update this Agent. Check your sign-in and permissions.",
  },
  zh: {
    syncSettings: "提问工具设置",
    syncCaution:
      "仅同步当前所选 Agent 的本工具简介，保留所有工具开关和配置，不重载 Agent。",
    syncCurrent: "当前工具简介",
    syncTarget: "将同步的中文简介",
    syncAction: "同步中文简介",
    syncRefresh: "刷新",
    syncLoading: "正在读取…",
    syncAlready: "中文简介已是最新，无需同步。",
    syncSuccess: "中文简介已保存并复核。",
    syncChanged: "工具简介已变化，请刷新并确认后重试。",
    syncAgentChanged: "当前所选 Agent 已切换，已停止后续请求。",
    syncMissingTool: "此 Agent 没有本插件工具的可读取配置。",
    syncReadError: "无法读取本工具简介，未发送修改。",
    syncWriteError: "更新失败，请先刷新确认当前配置后再重试。",
    syncVerifyError:
      "无法复核更新结果，请刷新检查配置；未自动回滚，以免覆盖其他修改。",
    syncAuthError: "你无权读取或修改此 Agent，请检查登录状态和权限。",
  },
  id: {
    syncSettings: "Pengaturan alat pertanyaan",
    syncCaution:
      "Sinkronkan hanya deskripsi alat ini untuk Agen yang dipilih. Semua sakelar dan konfigurasi alat dipertahankan. Agen tidak dimuat ulang.",
    syncCurrent: "Deskripsi alat saat ini",
    syncTarget: "Deskripsi bahasa Mandarin yang diterapkan",
    syncAction: "Sinkronkan deskripsi Mandarin",
    syncRefresh: "Muat ulang",
    syncLoading: "Memuat…",
    syncAlready: "Deskripsi Mandarin sudah terbaru.",
    syncSuccess: "Deskripsi Mandarin disimpan dan diverifikasi.",
    syncChanged:
      "Deskripsi alat berubah. Muat ulang dan periksa sebelum mencoba lagi.",
    syncAgentChanged:
      "Agen yang dipilih berubah. Permintaan berikutnya dihentikan.",
    syncMissingTool:
      "Agen ini tidak memiliki konfigurasi yang dapat dibaca untuk alat plugin ini.",
    syncReadError:
      "Deskripsi alat ini tidak dapat dibaca. Pembaruan tidak dikirim.",
    syncWriteError:
      "Pembaruan gagal. Muat ulang dan periksa konfigurasi sebelum mencoba lagi.",
    syncVerifyError:
      "Pembaruan tidak dapat diverifikasi. Muat ulang dan periksa konfigurasi; tidak ada pemulihan otomatis.",
    syncAuthError:
      "Anda tidak diizinkan membaca atau memperbarui Agen ini. Periksa login dan izin.",
  },
  ja: {
    syncSettings: "質問ツールの設定",
    syncCaution:
      "選択中のエージェントに対して本ツールの説明のみを同期します。全ツールの有効状態と設定を保持し、エージェントを再読み込みしません。",
    syncCurrent: "現在のツール説明",
    syncTarget: "適用する中国語の説明",
    syncAction: "中国語の説明を同期",
    syncRefresh: "更新",
    syncLoading: "読み込み中…",
    syncAlready: "中国語の説明は最新です。",
    syncSuccess: "中国語の説明を保存し、確認しました。",
    syncChanged: "ツールの説明が変更されました。更新して確認してください。",
    syncAgentChanged:
      "選択中のエージェントが変わったため、以降の要求を停止しました。",
    syncMissingTool:
      "このエージェントには本プラグインの読み取り可能な設定がありません。",
    syncReadError: "本ツールの説明を読み取れません。更新は送信していません。",
    syncWriteError:
      "更新に失敗しました。再試行する前に現在の設定を読み直してください。",
    syncVerifyError:
      "更新結果を確認できません。設定を読み直してください。自動ロールバックは行っていません。",
    syncAuthError:
      "このエージェントを読み取り・更新する権限がありません。ログインと権限を確認してください。",
  },
  "pt-BR": {
    syncSettings: "Configurações da ferramenta de perguntas",
    syncCaution:
      "Sincronize apenas a descrição desta ferramenta para o agente selecionado. Todas as opções e configurações das ferramentas são preservadas. O agente não é recarregado.",
    syncCurrent: "Descrição atual da ferramenta",
    syncTarget: "Descrição em chinês a aplicar",
    syncAction: "Sincronizar descrição em chinês",
    syncRefresh: "Atualizar",
    syncLoading: "Carregando…",
    syncAlready: "A descrição em chinês já está atualizada.",
    syncSuccess: "A descrição em chinês foi salva e verificada.",
    syncChanged:
      "A descrição da ferramenta mudou. Atualize e confira antes de tentar novamente.",
    syncAgentChanged:
      "O agente selecionado mudou. As próximas solicitações foram interrompidas.",
    syncMissingTool:
      "Este agente não tem uma configuração legível para esta ferramenta do plugin.",
    syncReadError:
      "Não foi possível ler a descrição desta ferramenta. Nenhuma atualização foi enviada.",
    syncWriteError:
      "A atualização falhou. Atualize e confira a configuração antes de tentar novamente.",
    syncVerifyError:
      "Não foi possível verificar a atualização. Confira a configuração; nenhuma reversão automática foi feita.",
    syncAuthError:
      "Você não tem permissão para ler ou atualizar este agente. Confira seu login e permissões.",
  },
  ru: {
    syncSettings: "Настройки инструмента вопросов",
    syncCaution:
      "Синхронизируется только описание этого инструмента у выбранного агента. Все переключатели и настройки инструментов сохраняются. Агент не перезагружается.",
    syncCurrent: "Текущее описание инструмента",
    syncTarget: "Китайское описание для применения",
    syncAction: "Синхронизировать китайское описание",
    syncRefresh: "Обновить",
    syncLoading: "Загрузка…",
    syncAlready: "Китайское описание уже актуально.",
    syncSuccess: "Китайское описание сохранено и проверено.",
    syncChanged: "Описание инструмента изменилось. Обновите и проверьте его.",
    syncAgentChanged:
      "Выбранный агент изменился. Последующие запросы остановлены.",
    syncMissingTool:
      "У этого агента нет доступной для чтения конфигурации инструмента плагина.",
    syncReadError:
      "Не удалось прочитать описание инструмента. Обновление не отправлено.",
    syncWriteError:
      "Обновление не удалось. Перед повтором проверьте текущую конфигурацию.",
    syncVerifyError:
      "Результат обновления не подтверждён. Проверьте конфигурацию; автоматический откат не выполнялся.",
    syncAuthError:
      "Нет прав на чтение или изменение этого агента. Проверьте вход и разрешения.",
  },
  vi: {
    syncSettings: "Cài đặt công cụ câu hỏi",
    syncCaution:
      "Chỉ đồng bộ mô tả công cụ này cho tác nhân được chọn. Mọi công tắc và cấu hình công cụ được giữ nguyên. Tác nhân không bị tải lại.",
    syncCurrent: "Mô tả công cụ hiện tại",
    syncTarget: "Mô tả tiếng Trung sẽ áp dụng",
    syncAction: "Đồng bộ mô tả tiếng Trung",
    syncRefresh: "Làm mới",
    syncLoading: "Đang tải…",
    syncAlready: "Mô tả tiếng Trung đã được cập nhật.",
    syncSuccess: "Đã lưu và kiểm tra mô tả tiếng Trung.",
    syncChanged:
      "Mô tả công cụ đã thay đổi. Làm mới và kiểm tra trước khi thử lại.",
    syncAgentChanged:
      "Tác nhân được chọn đã thay đổi. Đã dừng các yêu cầu tiếp theo.",
    syncMissingTool:
      "Tác nhân này không có cấu hình có thể đọc cho công cụ của tiện ích.",
    syncReadError: "Không thể đọc mô tả công cụ này. Chưa gửi cập nhật.",
    syncWriteError:
      "Cập nhật thất bại. Làm mới và kiểm tra cấu hình trước khi thử lại.",
    syncVerifyError:
      "Chưa xác nhận được kết quả cập nhật. Hãy kiểm tra cấu hình; không tự động hoàn tác.",
    syncAuthError:
      "Bạn không có quyền đọc hoặc cập nhật tác nhân này. Hãy kiểm tra đăng nhập và quyền.",
  },
};

const en = {
  ...syncMessages.en,
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
    ...syncMessages.zh,
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
    ...syncMessages.id,
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
    ...syncMessages.ja,
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
    ...syncMessages["pt-BR"],
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
    ...syncMessages.ru,
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
    ...syncMessages.vi,
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
