export const LOCALES = ["en", "ru"] as const;
export const THEMES = ["dark", "light"] as const;

export type Locale = (typeof LOCALES)[number];
export type ArenaTheme = (typeof THEMES)[number];

type ResultSignalArgs = {
  result: string;
  finish: string;
  moveCount: number;
};

type CountArgs = {
  count: number;
};

type SummaryArgs = {
  ratingDelta: number;
  lastMove: string;
};

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function isArenaTheme(value: unknown): value is ArenaTheme {
  return THEMES.includes(value as ArenaTheme);
}

export const translations = {
  en: {
    common: {
      home: "Home",
      play: "Play",
      profile: "Profile",
      leaderboard: "Leaderboard",
      pro: "Pro",
      settings: "Settings",
      guest: "Guest",
      rating: "rating",
      moves: "moves",
      to: "to",
      vs: "vs",
      you: "You",
      playAgain: "Play again",
      openReview: "Open review",
    },
    shell: {
      footerLoop: "Local demo loop: play, rate, review, progress.",
      rankedDemo: "Ranked demo",
      proConcept: "Pro concept",
    },
    settings: {
      eyebrow: "Settings",
      title: "Product preferences",
      body: "Choose the language and product theme for this browser-local MVP.",
      languageTitle: "Language",
      languageBody: "Navigation and the main product loop switch between RU and EN.",
      themeTitle: "Theme",
      themeBody: "Theme tokens switch without changing the chess flow.",
      storageNote:
        "Preferences are saved in localStorage in this browser. Guest progress and match history stay separate.",
      languages: {
        en: "English",
        ru: "Russian",
      },
      themes: {
        dark: "Dark",
        light: "Light",
      },
    },
    auth: {
      signIn: "Sign in",
      signUp: "Sign up",
      signOut: "Sign out",
      signInTitle: "Sign in to save progress",
      signUpTitle: "Create your arena account",
      emailLabel: "Email",
      passwordLabel: "Password",
      nicknameLabel: "Nickname",
      signInCta: "Sign in",
      signUpCta: "Create account",
      haveAccount: "Already have an account?",
      noAccount: "Need an account?",
      account: "Account",
      signedInAs: "Signed in as",
      guestNotice: "Play as a guest now, or sign in to save progress later.",
      emailConfirmSent:
        "Check your email to confirm the account before returning to the arena.",
      supabaseNotConfigured:
        "Supabase is not configured. Add the public URL and anon key to .env.local to use account auth.",
      playAsGuest: "Play as guest",
      working: "Working...",
      nicknameHint:
        "Optional. Leave it blank to derive a nickname from your email.",
    },
    errors: {
      authRequired: "Sign in to continue.",
      invalidCredentials: "Check your email and password, then try again.",
      sessionExpired: "Your session expired. Sign in again.",
      backendUnavailable: "The service is unavailable right now.",
      requestFailed: "The request failed. Try again.",
      saveFailed: "We could not save your progress. Try again.",
    },
    match: {
      color: {
        w: "White",
        b: "Black",
      },
      opponent: {
        localRival: "Local Rival",
      },
      result: {
        win: "Win",
        loss: "Loss",
        draw: "Draw",
      },
      finish: {
        checkmate: "Checkmate",
        resignation: "Resignation",
        stalemate: "Stalemate",
        insufficient: "Insufficient material",
        threefold: "Threefold repetition",
        "fifty-move": "Fifty-move rule",
      },
      status: {
        checkmateWinner: (winner: string) => `Checkmate - ${winner} wins`,
        resignationWinner: (winner: string) =>
          `${winner} wins by resignation`,
        stalemate: "Draw - stalemate",
        insufficient: "Draw - insufficient material",
        threefold: "Draw - threefold repetition",
        fiftyMove: "Draw - fifty-move rule",
        inCheck: (turn: string) => `${turn} is in check`,
        toMove: (turn: string) => `${turn} to move`,
      },
      live: "Live",
      final: "Final",
    },
    home: {
      coachReady: "Coach report ready",
      coachTitle: "Convert pressure cleanly",
      coachBody: "Review the last forcing sequence before the next ranked demo.",
      resultLabel: "Match result",
      winRating: "Win +25 rating",
      badges: ["Competitive chess MVP", "Browser-local ranked demo"],
      intro:
        "A chess match should leave a trail: rating, profile progress, leaderboard pressure, and a compact post-game coach review.",
      localIntro:
        "Play the current MVP without backend setup. Your guest nickname, match history, and local review flow stay in this browser.",
      playCta: "Play Ranked Demo",
      leaderboardCta: "See Leaderboard",
      signals: [
        { label: "Guest start", value: "No auth wall" },
        { label: "Rating loop", value: "+25 on wins" },
        { label: "Coach", value: "Post-game notes" },
      ],
      loopSteps: [
        {
          title: "Play",
          body: "Start ranked demo chess immediately as a local guest.",
        },
        {
          title: "Review",
          body: "Turn the finished match into a short coach report.",
        },
        {
          title: "Progress",
          body: "Carry rating, history, and leaderboard pressure into the next game.",
        },
      ],
      loopEyebrow: "Demo-ready loop",
      loopTitle: "The board is only the first screen.",
      loopBody:
        "Stage 2 keeps the working offline match flow intact. This demo layer connects it to progress screens that feel like a real competitive service.",
      profileLabel: "Profile",
      profileCard: "Rating, streak, match history",
      proLabel: "Pro concept",
      proCard: "Monetization without checkout",
    },
    play: {
      loading: "Loading arena...",
      nicknameError: "Enter a nickname to start the local ranked demo.",
      entryEyebrow: "Arena entry",
      entryTitle: "Start ranked as a guest.",
      entryBody:
        "Your first nickname opens the local loop: match result, rating change, profile history, leaderboard row, and coach review.",
      startRating: "Start rating",
      opponent: "Opponent",
      review: "Review",
      afterFinish: "After finish",
      guestProfile: "Guest profile",
      chooseNickname: "Choose a nickname",
      localProgress: "Demo progress stays in this browser for the current MVP.",
      nickname: "Nickname",
      enterArena: "Enter Arena",
      localRanked: "Local Ranked",
      accountRanked: "Account Ranked",
      hotSeat: "Untimed hot-seat",
      progressAsWhite:
        "Guest progress follows White through rating, review, and match history.",
      accountProgressAsWhite:
        "Account progress follows White through saved rating, review, and match history.",
      yourRating: "Your rating",
      level: "Level",
      blackPieces: "Black pieces",
      whitePieces: "White pieces",
      matchStatus: "Match status",
      playingHint: "Finish the board state to lock the local rating update.",
      finishedHint:
        "The finished result feeds review, profile history, and leaderboard rank.",
      savedResult: "Result saved locally",
      savedAccountResult: "Result saved to account",
      savingAccountResult: "Saving the finished result to your account...",
      accountErrorTitle: "Account progress is unavailable",
      accountErrorBody:
        "We could not load the account profile for this arena session. Try again before starting a saved match.",
      resign: "Resign",
      newGame: "New Game",
    },
    chess: {
      promoteTo: "Promote to:",
      moveList: "Move list",
      openingBoard: "Opening board",
      plyRecorded: (count: number) => `${count} ply recorded`,
      noMoves:
        "No moves yet. The first sequence will build the review trace.",
    },
    profile: {
      loading: "Loading profile...",
      eyebrow: "Guest profile",
      accountEyebrow: "Account profile",
      emptyTitle: "No local player yet",
      emptyBody:
        "Choose a nickname on the play screen to start a browser-local rating, match history, and review trail.",
      startMatch: "Start local match",
      levelSummary: (level: number, games: number) =>
        `Level ${level} guest with ${games} local ranked demo matches saved in this browser.`,
      accountLevelSummary: (level: number, games: number) =>
        `Level ${level} account with ${games} saved ranked demo matches.`,
      accountErrorTitle: "Account profile could not load",
      accountErrorBody:
        "Your session is active, but account progress could not be read right now.",
      joined: "Joined",
      peakRating: "Peak rating",
      currentRating: "Current loop rating",
      playAgain: "Play again",
      stats: {
        rating: "Rating",
        level: "Level",
        peak: "Peak",
        games: "Games",
        winrate: "Winrate",
        wins: "Wins",
        losses: "Losses",
        draws: "Draws",
        streak: "Streak",
      },
      badgesEyebrow: "Progress badges",
      statusTitle: "Arena status",
      badges: {
        founding: "Founding Guest",
        foundingDetail: "Local profile active",
        account: "Arena Account",
        accountDetail: "Supabase profile active",
        firstWin: "First Win",
        streak: "3 Win Streak",
        unlocked: "Unlocked",
        winOne: "Win one match",
        buildStreak: "Build streak",
      },
      latestSignal: "Latest signal",
      noResultTitle: "No match result yet",
      noResultBody:
        "Finish the first local ranked demo to light up history and coach review.",
      accountNoResultBody:
        "Play the first match to save progress in your account.",
      reviewLatest: "Review latest",
      startMatchShort: "Start match",
      history: "Match history",
      newestFirst: "Newest local results first",
      noMatches: "No matches yet. Finish your first local ranked demo game.",
      accountNewestFirst: "Newest saved results first",
      accountNoMatches: "Play the first match to save progress in your account.",
      review: "Review",
    },
    leaderboard: {
      eyebrow: "Demo leaderboard",
      accountEyebrow: "Global leaderboard",
      title: "Global local loop board",
      body: "Demo players keep the arena populated while your guest rating is read from this browser.",
      accountBody:
        "Account players ranked by rating from Supabase. Demo players fill the board while the player base is small.",
      chaseRating: "Chase rating",
      loading: "Loading leaderboard...",
      columns: {
        rank: "Rank",
        player: "Player",
        rating: "Rating",
        level: "Level",
        winrate: "Winrate",
        streak: "Streak",
        city: "City",
      },
      cities: {
        moscow: "Moscow",
        almaty: "Almaty",
        novosibirsk: "Novosibirsk",
        astana: "Astana",
        other: "Other",
        guest: "Guest",
      },
      streak: "streak",
      guestHintStart: "Your guest row appears after you",
      guestHintLink: "choose a nickname",
    },
    review: {
      loading: "Loading review...",
      eyebrow: "Match Review",
      missingTitle: "Review not found",
      missingBody:
        "Guest reviews stay with local match history. Account reviews load from saved matches when they are available.",
      backToProfile: "Back to profile",
      heuristic: "Demo heuristic coach",
      result: "Result",
      finish: "Finish",
      ratingPath: "Rating path",
      ratingDelta: "Rating change",
      moveTrace: "Move trace",
      fullMoves: (count: number) => `${count} full moves`,
      notesEyebrow: "Coach notes",
      signalsTitle: "Three review signals",
      signalsBody: "Built from result and SAN-history only",
      sequenceTitle: "Last sequence",
      noSanMoves: "No SAN moves were recorded for this finish.",
      trainEyebrow: "Train next",
      habitTitle: "One next habit",
      boundary: "No engine evaluation or API analysis runs in this local MVP review.",
      accountBoundary:
        "This saved account review is still heuristic. No engine evaluation or API analysis runs here.",
      aiCoach: {
        eyebrow: "AI Coach",
        generateBtn: "Generate AI Coach",
        generating: "Generating analysis...",
        notConfigured:
          "AI Coach is not configured in this environment. Add AI_COACH_API_BASE_URL, AI_COACH_API_KEY and AI_COACH_MODEL to enable it.",
        error:
          "AI analysis is unavailable right now. The demo review above is your fallback.",
        mainMistake: "Key moment",
        bestAlternative: "Better plan",
        whyImportant: "Why it matters",
        trainNext: "Train next",
        note: "AI analysis · No engine evaluation",
      },
      coach: {
        resultSignalTitle: "Result signal",
        resultSignalBody: ({ result, finish, moveCount }: ResultSignalArgs) =>
          `This local ranked demo ended as a ${result} by ${finish} after ${moveCount} full moves.`,
        kingPressureTitle: "King pressure",
        kingPressureBody: ({ count }: CountArgs) =>
          `${count} checking move${count === 1 ? "" : "s"} appeared in the move trace. Revisit the first check and ask whether development or king safety made it possible.`,
        quietPressureTitle: "Quiet pressure",
        quietPressureBody:
          "No checking move was recorded. In quieter games, compare your piece activity before trading or pushing pawns.",
        tradeTitle: "Trade discipline",
        tradeBody: ({ count }: CountArgs) =>
          `${count} captures were recorded. Before the next exchange, name which side benefits from the resulting position.`,
        kingRoutineTitle: "King routine",
        kingRoutineBody:
          "Castling showed up in the SAN history. Keep pairing king safety with a plan for your least active piece.",
        developmentTitle: "Development check",
        developmentBody:
          "No castling move was recorded. Use the opening review to spot when king safety and piece development slowed down.",
        headline: {
          win: "Convert pressure with a repeatable plan",
          loss: "Stabilize before the next tactical turn",
          draw: "Turn balanced positions into clear choices",
        },
        sequenceFallback: "sequence",
        winSummary: ({ ratingDelta, lastMove }: SummaryArgs) =>
          `You gained ${ratingDelta} rating in the local loop. The final move ${lastMove} is a good checkpoint for how the attack or conversion finished.`,
        lossSummary: ({ ratingDelta, lastMove }: SummaryArgs) =>
          `The local loop recorded ${ratingDelta} rating. Review the phase just before ${lastMove} and look for the last moment your position still had a simple defensive choice.`,
        drawSummary:
          "The rating stayed level. Use the move trace to identify where the position stopped offering forcing progress.",
        openingTraining:
          "Train opening habits: develop pieces, secure the king, then look for tactics.",
        tradeTraining:
          "Train calculation around trades: compare threats before and after each exchange.",
        candidateTraining:
          "Train candidate moves: list one improving move and one forcing move before committing.",
      },
    },
    pro: {
      eyebrow: "Monetization concept",
      title: "Upgrade to Pro",
      intro:
        "Pro is the premium lane for players who want deeper coaching, stronger progress tools, and a profile that feels tournament-ready.",
      boundary:
        "This screen is static in Stage 2.5. It demonstrates the product direction without starting payments, auth, or backend entitlements.",
      label: "Checkmate Arena Pro",
      comingSoon: "Coming soon",
      cardBody: "Premium analysis and presentation for repeat ranked players.",
      checkout: "Checkout coming soon",
      playDemo: "Play demo",
      featureLabel: "Pro feature",
      features: [
        "Advanced coach depth and longer review trails",
        "Detailed statistics for progress and season goals",
        "Premium profile presentation and board themes",
        "Private clubs, tournament access, and report export",
      ],
      demoBoundary: "Demo boundary",
      honestTitle: "What stays honest now",
      boundaries: [
        "No checkout is wired in this local MVP.",
        "The current review stays heuristic and browser-local.",
        "Account sync and premium entitlements arrive after backend work.",
      ],
    },
  },
  ru: {
    common: {
      home: "Главная",
      play: "Играть",
      profile: "Профиль",
      leaderboard: "Лидерборд",
      pro: "Pro",
      settings: "Настройки",
      guest: "Гость",
      rating: "рейтинга",
      moves: "ходов",
      to: "до",
      vs: "против",
      you: "Вы",
      playAgain: "Сыграть ещё",
      openReview: "Открыть разбор",
    },
    shell: {
      footerLoop: "Локальная demo-петля: партия, рейтинг, разбор, прогресс.",
      rankedDemo: "Ranked demo",
      proConcept: "Концепт Pro",
    },
    settings: {
      eyebrow: "Настройки",
      title: "Настройки продукта",
      body: "Выберите язык и тему для этого браузерного MVP.",
      languageTitle: "Язык",
      languageBody:
        "Навигация и основные экраны продуктовой петли переключаются между RU и EN.",
      themeTitle: "Тема",
      themeBody: "Токены темы меняются без изменений игрового сценария.",
      storageNote:
        "Настройки сохраняются в localStorage этого браузера. Guest-прогресс и история матчей хранятся отдельно.",
      languages: {
        en: "English",
        ru: "Русский",
      },
      themes: {
        dark: "Тёмная",
        light: "Светлая",
      },
    },
    auth: {
      signIn: "Войти",
      signUp: "Регистрация",
      signOut: "Выйти",
      signInTitle: "Войдите, чтобы сохранить прогресс",
      signUpTitle: "Создайте аккаунт арены",
      emailLabel: "Email",
      passwordLabel: "Пароль",
      nicknameLabel: "Ник",
      signInCta: "Войти",
      signUpCta: "Создать аккаунт",
      haveAccount: "Уже есть аккаунт?",
      noAccount: "Нужен аккаунт?",
      account: "Аккаунт",
      signedInAs: "Вход:",
      guestNotice:
        "Можно играть гостем сразу или войти, чтобы сохранить прогресс позже.",
      emailConfirmSent:
        "Проверьте почту и подтвердите аккаунт перед возвращением на арену.",
      supabaseNotConfigured:
        "Supabase не настроен. Добавьте публичный URL и anon key в .env.local, чтобы использовать аккаунты.",
      playAsGuest: "Играть гостем",
      working: "Выполняем...",
      nicknameHint:
        "Необязательно. Если оставить пустым, ник будет создан из email.",
    },
    errors: {
      authRequired: "Войдите, чтобы продолжить.",
      invalidCredentials: "Проверьте email и пароль и попробуйте ещё раз.",
      sessionExpired: "Сессия истекла. Войдите снова.",
      backendUnavailable: "Сервис сейчас недоступен.",
      requestFailed: "Запрос не выполнился. Попробуйте ещё раз.",
      saveFailed: "Не удалось сохранить прогресс. Попробуйте ещё раз.",
    },
    match: {
      color: {
        w: "Белые",
        b: "Чёрные",
      },
      opponent: {
        localRival: "Локальный соперник",
      },
      result: {
        win: "Победа",
        loss: "Поражение",
        draw: "Ничья",
      },
      finish: {
        checkmate: "Мат",
        resignation: "Сдача",
        stalemate: "Пат",
        insufficient: "Недостаточно материала",
        threefold: "Троекратное повторение",
        "fifty-move": "Правило 50 ходов",
      },
      status: {
        checkmateWinner: (winner: string) => `Мат - ${winner} побеждают`,
        resignationWinner: (winner: string) =>
          `${winner} побеждают после сдачи`,
        stalemate: "Ничья - пат",
        insufficient: "Ничья - недостаточно материала",
        threefold: "Ничья - троекратное повторение",
        fiftyMove: "Ничья - правило 50 ходов",
        inCheck: (turn: string) => `${turn}: шах`,
        toMove: (turn: string) => `Ходят ${turn}`,
      },
      live: "Идёт",
      final: "Финал",
    },
    home: {
      coachReady: "Разбор готов",
      coachTitle: "Доведите давление до результата",
      coachBody: "Проверьте последнюю форсированную серию перед новой ranked demo.",
      resultLabel: "Результат матча",
      winRating: "Победа +25 рейтинга",
      badges: ["Competitive chess MVP", "Локальная ranked demo"],
      intro:
        "Шахматный матч должен оставлять след: рейтинг, прогресс профиля, давление лидерборда и короткий post-game разбор.",
      localIntro:
        "Играйте в текущий MVP без backend. Ник гостя, история матчей и локальный разбор остаются в этом браузере.",
      playCta: "Играть Ranked Demo",
      leaderboardCta: "Смотреть лидерборд",
      signals: [
        { label: "Старт гостем", value: "Без auth-стены" },
        { label: "Рейтинг", value: "+25 за победу" },
        { label: "Coach", value: "Заметки после игры" },
      ],
      loopSteps: [
        {
          title: "Играй",
          body: "Начните ranked demo сразу как локальный гость.",
        },
        {
          title: "Разбирай",
          body: "Превратите завершённый матч в короткий coach report.",
        },
        {
          title: "Расти",
          body: "Возьмите рейтинг, историю и лидерборд в следующую партию.",
        },
      ],
      loopEyebrow: "Demo-ready петля",
      loopTitle: "Доска только открывает сценарий.",
      loopBody:
        "Stage 2 сохраняет рабочий offline match flow. Этот demo-слой связывает его с экранами прогресса соревновательного сервиса.",
      profileLabel: "Профиль",
      profileCard: "Рейтинг, streak, история матчей",
      proLabel: "Концепт Pro",
      proCard: "Монетизация без checkout",
    },
    play: {
      loading: "Загружаем арену...",
      nicknameError: "Введите ник, чтобы начать локальный ranked demo-матч.",
      entryEyebrow: "Вход на арену",
      entryTitle: "Начните ranked-матч гостем.",
      entryBody:
        "Первый ник открывает локальную петлю: результат, изменение рейтинга, историю профиля, строку лидерборда и разбор.",
      startRating: "Стартовый рейтинг",
      opponent: "Соперник",
      review: "Разбор",
      afterFinish: "После партии",
      guestProfile: "Профиль гостя",
      chooseNickname: "Выберите ник",
      localProgress: "Демо-прогресс сохраняется в этом браузере для текущего MVP.",
      nickname: "Ник",
      enterArena: "Войти на арену",
      localRanked: "Локальный Ranked",
      accountRanked: "Account Ranked",
      hotSeat: "Hot-seat без таймера",
      progressAsWhite:
        "Прогресс гостя записывается за белых: рейтинг, разбор и история матчей.",
      accountProgressAsWhite:
        "Прогресс аккаунта записывается за белых: рейтинг, разбор и история матчей.",
      yourRating: "Ваш рейтинг",
      level: "Уровень",
      blackPieces: "Чёрные фигуры",
      whitePieces: "Белые фигуры",
      matchStatus: "Статус матча",
      playingHint: "Завершите позицию на доске, чтобы сохранить изменение рейтинга.",
      finishedHint:
        "Завершённый результат идёт в разбор, историю профиля и позицию в лидерборде.",
      savedResult: "Результат сохранён локально",
      savedAccountResult: "Результат сохранён в аккаунт",
      savingAccountResult: "Сохраняем завершённый результат в аккаунт...",
      accountErrorTitle: "Прогресс аккаунта недоступен",
      accountErrorBody:
        "Не удалось загрузить профиль аккаунта для этой сессии арены. Попробуйте снова перед сохранённым матчем.",
      resign: "Сдаться",
      newGame: "Новая партия",
    },
    chess: {
      promoteTo: "Превратить в:",
      moveList: "Список ходов",
      openingBoard: "Стартовая позиция",
      plyRecorded: (count: number) => `Полуходов записано: ${count}`,
      noMoves: "Ходов пока нет. Первая серия попадёт в след разбора.",
    },
    profile: {
      loading: "Загружаем профиль...",
      eyebrow: "Профиль гостя",
      accountEyebrow: "Профиль аккаунта",
      emptyTitle: "Локального игрока пока нет",
      emptyBody:
        "Выберите ник на экране игры, чтобы начать локальный рейтинг, историю матчей и цепочку разборов.",
      startMatch: "Начать локальный матч",
      levelSummary: (level: number, games: number) =>
        `Гость уровня ${level}: локальных ranked demo матчей в этом браузере - ${games}.`,
      accountLevelSummary: (level: number, games: number) =>
        `Аккаунт уровня ${level}: сохранённых ranked demo матчей - ${games}.`,
      accountErrorTitle: "Профиль аккаунта не загрузился",
      accountErrorBody:
        "Сессия активна, но прогресс аккаунта сейчас не удалось прочитать.",
      joined: "Создан",
      peakRating: "Пиковый рейтинг",
      currentRating: "Текущий рейтинг",
      playAgain: "Сыграть ещё",
      stats: {
        rating: "Рейтинг",
        level: "Уровень",
        peak: "Пик",
        games: "Матчи",
        winrate: "Winrate",
        wins: "Победы",
        losses: "Поражения",
        draws: "Ничьи",
        streak: "Streak",
      },
      badgesEyebrow: "Бейджи прогресса",
      statusTitle: "Статус арены",
      badges: {
        founding: "Founding Guest",
        foundingDetail: "Локальный профиль активен",
        account: "Аккаунт арены",
        accountDetail: "Профиль Supabase активен",
        firstWin: "Первая победа",
        streak: "3 победы подряд",
        unlocked: "Открыт",
        winOne: "Выиграйте один матч",
        buildStreak: "Соберите серию",
      },
      latestSignal: "Последний сигнал",
      noResultTitle: "Результатов матчей пока нет",
      noResultBody:
        "Завершите первую локальную ranked demo, чтобы открыть историю и разбор.",
      accountNoResultBody:
        "Сыграй первый матч, чтобы сохранить прогресс в аккаунте.",
      reviewLatest: "Разобрать последний",
      startMatchShort: "Начать матч",
      history: "История матчей",
      newestFirst: "Сначала новые локальные результаты",
      noMatches: "Матчей пока нет. Завершите первую локальную ranked demo.",
      accountNewestFirst: "Сначала новые сохранённые результаты",
      accountNoMatches: "Сыграй первый матч, чтобы сохранить прогресс в аккаунте.",
      review: "Разбор",
    },
    leaderboard: {
      eyebrow: "Demo-лидерборд",
      accountEyebrow: "Глобальный лидерборд",
      title: "Глобальный лидерборд локальной петли",
      body: "Демо-игроки поддерживают арену живой, пока рейтинг гостя берётся из этого браузера.",
      accountBody:
        "Игроки аккаунтов ранжированы по рейтингу из Supabase. Демо-игроки дополняют доску, пока игроков мало.",
      chaseRating: "Поднять рейтинг",
      loading: "Загружаем лидерборд...",
      columns: {
        rank: "Место",
        player: "Игрок",
        rating: "Рейтинг",
        level: "Уровень",
        winrate: "Winrate",
        streak: "Streak",
        city: "Город",
      },
      cities: {
        moscow: "Москва",
        almaty: "Алматы",
        novosibirsk: "Новосибирск",
        astana: "Астана",
        other: "Другой город",
        guest: "Гость",
      },
      streak: "серия",
      guestHintStart: "Ваша guest-строка появится после того, как вы",
      guestHintLink: "выберете ник",
    },
    review: {
      loading: "Загружаем разбор...",
      eyebrow: "Разбор матча",
      missingTitle: "Разбор не найден",
      missingBody:
        "Guest-разборы остаются с локальной историей матчей. Разборы аккаунта загружаются из сохранённых матчей, когда они доступны.",
      backToProfile: "Назад в профиль",
      heuristic: "Demo heuristic coach",
      result: "Результат",
      finish: "Финиш",
      ratingPath: "Путь рейтинга",
      ratingDelta: "Изменение рейтинга",
      moveTrace: "След ходов",
      fullMoves: (count: number) => `Полных ходов: ${count}`,
      notesEyebrow: "Заметки Coach",
      signalsTitle: "Три сигнала разбора",
      signalsBody: "Построено только по результату и SAN-истории",
      sequenceTitle: "Последняя серия",
      noSanMoves: "Для этого финиша SAN-ходы не записаны.",
      trainEyebrow: "Тренировать дальше",
      habitTitle: "Одна следующая привычка",
      boundary: "В этом локальном MVP-разборе нет engine evaluation и API-анализа.",
      accountBoundary:
        "Этот сохранённый разбор аккаунта всё ещё эвристический: engine evaluation и API-анализ здесь не запускаются.",
      aiCoach: {
        eyebrow: "AI Coach",
        generateBtn: "AI-разбор",
        generating: "Генерируем анализ...",
        notConfigured:
          "AI Coach не настроен в этой среде. Добавьте AI_COACH_API_BASE_URL, AI_COACH_API_KEY и AI_COACH_MODEL, чтобы включить его.",
        error:
          "AI-анализ сейчас недоступен. Выше показан demo-разбор как запасной вариант.",
        mainMistake: "Ключевой момент",
        bestAlternative: "Лучший план",
        whyImportant: "Почему важно",
        trainNext: "Что тренировать",
        note: "AI-анализ · Без engine evaluation",
      },
      coach: {
        resultSignalTitle: "Сигнал результата",
        resultSignalBody: ({ result, finish, moveCount }: ResultSignalArgs) =>
          `Локальная ranked demo завершилась как ${result}: ${finish}. Полных ходов - ${moveCount}.`,
        kingPressureTitle: "Давление на короля",
        kingPressureBody: ({ count }: CountArgs) =>
          `Шахующих ходов в следе: ${count}. Вернитесь к первому шаху и проверьте, помогли ли ему развитие или безопасность короля.`,
        quietPressureTitle: "Тихое давление",
        quietPressureBody:
          "Шахующих ходов не записано. В спокойных партиях сравнивайте активность фигур перед разменами и пешечными толчками.",
        tradeTitle: "Дисциплина разменов",
        tradeBody: ({ count }: CountArgs) =>
          `В истории записано взятий: ${count}. Перед следующим разменом назовите сторону, которой выгодна новая позиция.`,
        kingRoutineTitle: "Рутина короля",
        kingRoutineBody:
          "В SAN-истории есть рокировка. Связывайте безопасность короля с планом для самой пассивной фигуры.",
        developmentTitle: "Проверка развития",
        developmentBody:
          "Рокировка не записана. На review найдите момент, где замедлились безопасность короля и развитие фигур.",
        headline: {
          win: "Закрепите давление повторяемым планом",
          loss: "Стабилизируйтесь до следующего тактического поворота",
          draw: "Превратите равные позиции в ясные решения",
        },
        sequenceFallback: "финальной серией",
        winSummary: ({ ratingDelta, lastMove }: SummaryArgs) =>
          `Локальная петля дала +${ratingDelta} рейтинга. Финальный ход ${lastMove} - удобная точка проверки атаки или реализации.`,
        lossSummary: ({ ratingDelta, lastMove }: SummaryArgs) =>
          `Локальная петля записала ${ratingDelta} рейтинга. Проверьте фазу перед ${lastMove} и найдите последний простой защитный выбор.`,
        drawSummary:
          "Рейтинг остался на месте. Используйте след ходов, чтобы найти момент, где позиция перестала давать форсированный прогресс.",
        openingTraining:
          "Тренируйте дебютные привычки: развивайте фигуры, обезопасьте короля, затем ищите тактику.",
        tradeTraining:
          "Тренируйте расчёт разменов: сравнивайте угрозы до и после каждого взятия.",
        candidateTraining:
          "Тренируйте ходы-кандидаты: назовите один улучшающий и один форсированный ход перед выбором.",
      },
    },
    pro: {
      eyebrow: "Концепт монетизации",
      title: "Upgrade to Pro",
      intro:
        "Pro - премиальный слой для игроков, которым нужны более глубокий coach, сильнее инструменты прогресса и профиль для турнирного ощущения.",
      boundary:
        "Этот экран статичен в Stage 2.5. Он показывает направление продукта без оплаты, auth и backend entitlements.",
      label: "Checkmate Arena Pro",
      comingSoon: "Скоро",
      cardBody: "Премиальный анализ и подача для игроков, которые возвращаются в ranked.",
      checkout: "Checkout скоро",
      playDemo: "Играть demo",
      featureLabel: "Pro-функция",
      features: [
        "Более глубокий coach и длиннее цепочка разборов",
        "Детальная статистика прогресса и сезонных целей",
        "Премиальная подача профиля и темы доски",
        "Private clubs, турниры и экспорт отчётов",
      ],
      demoBoundary: "Граница demo",
      honestTitle: "Что остаётся честным сейчас",
      boundaries: [
        "Checkout не подключён в этом локальном MVP.",
        "Текущий review остаётся эвристическим и браузерным.",
        "Синхронизация аккаунта и Pro entitlements идут после backend.",
      ],
    },
  },
} as const;

export type AppTranslations = (typeof translations)[Locale];
